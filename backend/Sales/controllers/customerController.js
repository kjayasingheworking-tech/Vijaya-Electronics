const Customer = require("../models/CustomerModel.js");
const User = require("../models/UserModel.js");
const { calculateCreditLimit, updateCustomerCredit } = require("../services/creditService.js");

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
    const customer = await Customer.findById(req.params.id)
      .populate('user', 'name email role isActive');
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
    customer.blocked = Boolean(blockedStatus);
    await customer.save();

    // Step 3: Get user details if customer has user account
    await customer.populate('user', 'name email role isActive');

    // Step 4: Send response with success message
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

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  getCustomerByPhone,
  getCustomerByEmail,
  updateCustomerBlockStatus,
  updateCustomerCreditInfo
};
