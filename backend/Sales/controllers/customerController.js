const Customer = require("../models/CustomerModel.js");
const User = require("../models/UserModel.js");
const { calculateCreditLimit, updateCustomerCredit } = require("../services/creditService.js");
const { v4: uuidv4 } = require("uuid");
const { findOrCreateCustomer, getSalesCustomerId } = require("../utils/customerHelper.js");

const listCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find()
      .populate('user', 'name email role isActive')
      .limit(200);
    res.json(customers);
  } catch (err) { next(err); }
};

const createCustomer = async (req, res, next) => {
  try {
    const customerData = req.body;
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: customerData.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    // Create User account for both regular and wholesale customers
    const userData = {
      name: customerData.name,
      email: customerData.email,
      role: "customer",
      isActive: true
    };
    
    const user = new User(userData);
    await user.save();
    
    // Create Customer record with User ID
    customerData.user = user._id;
    
    // Generate customerId if not provided
    if (!customerData.customerId) {
      customerData.customerId = `CUST-${uuidv4()}`;
    }
    
    // Set tier to silver for all new customers
    customerData.tier = "silver";
    
    // Set credit fields only for wholesale customers
    if (customerData.type === "wholesale") {
      // Calculate initial credit limit based on tier and purchase amount
      const initialCreditLimit = calculateCreditLimit({
        type: customerData.type,
        tier: customerData.tier,
        totalPurchaseAmount: customerData.totalPurchaseAmount || 0
      });
      
      customerData.creditLimit = initialCreditLimit;
      customerData.currentCreditUsed = 0;
      customerData.creditAvailable = initialCreditLimit;
    }
    
    const customer = new Customer(customerData);
    await customer.save();
    
    // Get user details and send response
    await customer.populate('user', 'name email role isActive');
    res.status(201).json(customer);
    
  } catch (err) { 
    console.error("Customer creation error:", err);
    next(err); 
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    
    // First try to find by Customer ID
    let customer = await Customer.findById(customerId)
      .populate('user', 'name email role isActive');
    
    // If not found, try to find by User ID (for authenticated users)
    if (!customer) {
      customer = await Customer.findOne({ user: customerId })
        .populate('user', 'name email role isActive');
    }
    
    // If still not found, try to create a customer record for the user
    if (!customer) {
      // Try to find user in main User collection first
      const MainUser = require("../../models/User.js");
      const mainUser = await MainUser.findById(customerId);
      
      if (mainUser && mainUser.role === 'customer') {
        // Create a corresponding user in Sales UserTemp collection
        const SalesUser = require("../models/UserModel.js");
        let salesUser = await SalesUser.findOne({ email: mainUser.email });
        
        if (!salesUser) {
          // Create sales user
          salesUser = new SalesUser({
            name: mainUser.name,
            email: mainUser.email,
            role: mainUser.role,
            isActive: mainUser.isActive || true
          });
          await salesUser.save();
        }
        
        // Create Sales Customer record
        const customerData = {
          user: salesUser._id,
          name: mainUser.name,
          email: mainUser.email,
          type: 'regular', // default to regular customer
          tier: 'silver'
        };
        
        customer = new Customer(customerData);
        await customer.save();
        customer = await Customer.findById(customer._id)
          .populate('user', 'name email role isActive');
      }
    }
    
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) { next(err); }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id; // assume URL is /customers/:id
    const updateData = req.body;

    // Find the customer by ID and update
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true } // return updated doc & validate
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(updatedCustomer);
  } catch (err) {
    next(err);
  }
};

// GET customer by phone
const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = await Customer.findOne({ phone })
      .populate('user', 'name email role isActive');

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer by phone:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET customer by email
const getCustomerByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email })
      .populate('user', 'name email role isActive');

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer by email:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update customer block status
const updateCustomerBlockStatus = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const blockedStatus = req.body.blocked;

    // Step 1: Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Step 2: Update the blocked status
    const wasBlocked = customer.blocked;
    customer.blocked = Boolean(blockedStatus);
    await customer.save();

    // Step 3: Get user details if customer has user account
    await customer.populate('user', 'name email role isActive');

    // Step 4: Send notification to sales managers if customer was blocked
    if (customer.blocked && !wasBlocked) {
      try {
        await notifyAllSalesManagers(
          'warning',
          'Customer Blocked',
          `Customer ${customer.name} has been blocked. Reason: ${customer.blockedReason || 'Manual block'}. Blocked by: ${req.user?.name || 'System'}`,
          {
            relatedEntity: 'customer',
            relatedEntityId: customer._id,
            customerName: customer.name,
            reason: customer.blockedReason || 'Manual block',
            blockedBy: req.user?.name || 'System'
          }
        );
      } catch (notificationError) {
        console.error("Error sending customer block notification:", notificationError);
        // Don't fail the block operation if notifications fail
      }
    }

    // Step 5: Send response with success message
    let message;
    if (customer.blocked) {
      message = "Customer blocked successfully";
    } else {
      message = "Customer unblocked successfully";
    }

    res.json({
      message: message,
      customer: customer
    });
  } catch (err) {
    console.error("Error updating customer block status:", err);
    next(err);
  }
};

// Update customer credit information (for testing)
const updateCustomerCreditInfo = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    
    // Update customer credit information
    const updatedCustomer = await updateCustomerCredit(customerId);
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found or not a wholesale customer" });
    }

    res.json({
      message: "Customer credit information updated successfully",
      customer: {
        _id: updatedCustomer._id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        type: updatedCustomer.type,
        tier: updatedCustomer.tier,
        totalPurchaseAmount: updatedCustomer.totalPurchaseAmount,
        creditLimit: updatedCustomer.creditLimit,
        currentCreditUsed: updatedCustomer.currentCreditUsed,
        creditAvailable: updatedCustomer.creditAvailable
      }
    });
  } catch (err) {
    console.error("Error updating customer credit:", err);
    next(err);
  }
};

// Get Sales Customer ID from main User ID
const getSalesCustomerIdByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const salesCustomerId = await getSalesCustomerId(userId);
    
    if (!salesCustomerId) {
      return res.status(404).json({ message: "Sales Customer not found" });
    }
    
    res.json({ 
      success: true, 
      salesCustomerId: salesCustomerId,
      message: "Sales Customer ID retrieved successfully"
    });
  } catch (err) { 
    next(err); 
  }
};

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  getCustomerByPhone,
  getCustomerByEmail,
  updateCustomerBlockStatus,
  updateCustomerCreditInfo,
  getSalesCustomerIdByUserId
};
