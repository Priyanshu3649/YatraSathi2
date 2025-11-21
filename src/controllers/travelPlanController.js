const { TravelPlan, User } = require('../models');
const { Sequelize } = require('sequelize');

// Create a new travel plan
const createTravelPlan = async (req, res) => {
  try {
    const { title, description, startDate, endDate, destination, budget, activities } = req.body;
    
    const travelPlan = await TravelPlan.create({
      tp_title: title,
      tp_description: description,
      tp_startdate: startDate,
      tp_enddate: endDate,
      tp_destination: destination,
      tp_budget: budget,
      tp_activities: JSON.stringify(activities),
      tp_usid: req.user.us_usid,
      tp_ispublic: 0, // Default to private
      tp_sharedwith: JSON.stringify([]), // Default to empty array
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    res.status(201).json(travelPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all travel plans for a user (including shared plans)
const getUserTravelPlans = async (req, res) => {
  try {
    // Get user's own plans
    const userPlans = await TravelPlan.findAll({ 
      where: { tp_usid: req.user.us_usid },
      order: [['edtm', 'DESC']]
    });
    
    // Get plans shared with the user
    const sharedPlans = await TravelPlan.findAll({
      where: {
        tp_ispublic: 1 // Public plans
      },
      order: [['edtm', 'DESC']]
    });
    
    // Get plans explicitly shared with the user
    const explicitlySharedPlans = await TravelPlan.findAll({
      where: {
        tp_sharedwith: {
          [Sequelize.Op.like]: `%${req.user.us_usid}%`
        }
      },
      order: [['edtm', 'DESC']]
    });
    
    // Combine all plans and remove duplicates
    const allPlans = [...userPlans, ...sharedPlans, ...explicitlySharedPlans];
    const uniquePlans = allPlans.filter((plan, index, self) => 
      index === self.findIndex(p => p.tp_tpid === plan.tp_tpid)
    );
    
    res.json(uniquePlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific travel plan by ID
const getTravelPlanById = async (req, res) => {
  try {
    const travelPlan = await TravelPlan.findByPk(req.params.id);
    
    // Check if user has access to this plan
    const userId = req.user.us_usid;
    const isOwner = travelPlan.tp_usid === userId;
    const isPublic = travelPlan.tp_ispublic === 1;
    const isSharedWithUser = travelPlan.tp_sharedwith && 
      JSON.parse(travelPlan.tp_sharedwith).includes(userId);
    
    if (travelPlan && (isOwner || isPublic || isSharedWithUser)) {
      res.json(travelPlan);
    } else {
      res.status(404).json({ message: 'Travel plan not found or access denied' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a travel plan
const updateTravelPlan = async (req, res) => {
  try {
    const { title, description, startDate, endDate, destination, budget, activities } = req.body;
    
    const travelPlan = await TravelPlan.findByPk(req.params.id);
    
    if (travelPlan && travelPlan.tp_usid === req.user.us_usid) {
      travelPlan.tp_title = title || travelPlan.tp_title;
      travelPlan.tp_description = description || travelPlan.tp_description;
      travelPlan.tp_startdate = startDate || travelPlan.tp_startdate;
      travelPlan.tp_enddate = endDate || travelPlan.tp_enddate;
      travelPlan.tp_destination = destination || travelPlan.tp_destination;
      travelPlan.tp_budget = budget || travelPlan.tp_budget;
      travelPlan.tp_activities = activities ? JSON.stringify(activities) : travelPlan.tp_activities;
      travelPlan.mby = req.user.us_usid;
      
      const updatedPlan = await travelPlan.save();
      res.json(updatedPlan);
    } else {
      res.status(404).json({ message: 'Travel plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a travel plan
const deleteTravelPlan = async (req, res) => {
  try {
    const travelPlan = await TravelPlan.findByPk(req.params.id);
    
    if (travelPlan && travelPlan.tp_usid === req.user.us_usid) {
      await travelPlan.destroy();
      res.json({ message: 'Travel plan removed' });
    } else {
      res.status(404).json({ message: 'Travel plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Share a travel plan with specific users
const shareTravelPlan = async (req, res) => {
  try {
    const { userIDs, isPublic } = req.body;
    const travelPlan = await TravelPlan.findByPk(req.params.id);
    
    // Check if user owns the plan
    if (travelPlan && travelPlan.tp_usid === req.user.us_usid) {
      // Update public status if provided
      if (isPublic !== undefined) {
        travelPlan.tp_ispublic = isPublic ? 1 : 0;
      }
      
      // Update shared users if provided
      if (userIDs) {
        // Validate that all user IDs exist
        const validUsers = await User.findAll({
          where: {
            us_usid: userIDs
          }
        });
        
        if (validUsers.length !== userIDs.length) {
          return res.status(400).json({ message: 'One or more user IDs are invalid' });
        }
        
        travelPlan.tp_sharedwith = JSON.stringify(userIDs);
      }
      
      travelPlan.mby = req.user.us_usid;
      const updatedPlan = await travelPlan.save();
      
      res.json({
        message: 'Travel plan sharing updated successfully',
        travelPlan: updatedPlan
      });
    } else {
      res.status(404).json({ message: 'Travel plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get users a travel plan is shared with
const getSharedUsers = async (req, res) => {
  try {
    const travelPlan = await TravelPlan.findByPk(req.params.id);
    
    // Check if user has access to this plan
    const userId = req.user.us_usid;
    const isOwner = travelPlan.tp_usid === userId;
    const isPublic = travelPlan.tp_ispublic === 1;
    const isSharedWithUser = travelPlan.tp_sharedwith && 
      JSON.parse(travelPlan.tp_sharedwith).includes(userId);
    
    if (travelPlan && (isOwner || isPublic || isSharedWithUser)) {
      const sharedWith = travelPlan.tp_sharedwith ? JSON.parse(travelPlan.tp_sharedwith) : [];
      const users = await User.findAll({
        where: {
          us_usid: sharedWith
        },
        attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email']
      });
      
      res.json({
        isPublic: travelPlan.tp_ispublic === 1,
        sharedWith: users
      });
    } else {
      res.status(404).json({ message: 'Travel plan not found or access denied' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTravelPlan,
  getUserTravelPlans,
  getTravelPlanById,
  updateTravelPlan,
  deleteTravelPlan,
  shareTravelPlan,
  getSharedUsers
};