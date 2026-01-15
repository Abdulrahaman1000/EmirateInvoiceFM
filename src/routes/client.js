// ============================================
// FILE: src/routes/client.js
// Client management routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/clients
 * @desc    Get all clients (supports search)
 * @access  Private
 * @query   search - search by company name
 */
router.get('/clients', protect, getClients);

/**
 * @route   GET /api/clients/:id
 * @desc    Get single client by ID
 * @access  Private
 */
router.get('/clients/:id', protect, getClientById);

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private
 */
router.post('/clients', protect, createClient);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private
 */
router.put('/clients/:id', protect, updateClient);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client (only if no invoices linked)
 * @access  Private
 */
router.delete('/clients/:id', protect, deleteClient);

module.exports = router;