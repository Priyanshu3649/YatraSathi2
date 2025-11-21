const express = require('express');
const {
  createTravelPlan,
  getUserTravelPlans,
  getTravelPlanById,
  updateTravelPlan,
  deleteTravelPlan,
  shareTravelPlan,
  getSharedUsers
} = require('../controllers/travelPlanController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Routes
router.route('/')
  .post(createTravelPlan)
  .get(getUserTravelPlans);

router.route('/:id')
  .get(getTravelPlanById)
  .put(updateTravelPlan)
  .delete(deleteTravelPlan);

// Sharing routes
router.route('/:id/share')
  .post(shareTravelPlan);

router.route('/:id/shared-users')
  .get(getSharedUsers);

module.exports = router;