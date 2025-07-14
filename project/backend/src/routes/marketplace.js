const express = require('express');
const router = express.Router();

// In-memory storage for marketplace
const listings = new Map();
const userListings = new Map();
const savedListings = new Map();

// Get all marketplace listings
router.get('/', (req, res) => {
  try {
    const { proximity = 'neighborhood', category, search } = req.query;
    
    let allListings = Array.from(listings.values())
      .filter(listing => listing.proximity === proximity && listing.status === 'active');
    
    // Filter by category if provided
    if (category) {
      allListings = allListings.filter(listing => listing.category === category);
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allListings = allListings.filter(listing => 
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    allListings = allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      listings: allListings
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// Create a new listing
router.post('/', (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      price,
      category,
      condition,
      images = [],
      tags = [],
      proximity = 'neighborhood',
      location,
      contactInfo
    } = req.body;
    
    if (!userId || !title || !description || !price || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, title, description, price, and category are required' 
      });
    }
    
    const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newListing = {
      id: listingId,
      userId,
      title,
      description,
      price: parseFloat(price),
      category,
      condition: condition || 'good',
      images,
      tags,
      proximity,
      location,
      contactInfo,
      status: 'active',
      views: 0,
      saves: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    listings.set(listingId, newListing);
    
    // Add to user's listings
    if (!userListings.has(userId)) {
      userListings.set(userId, []);
    }
    userListings.get(userId).push(listingId);
    
    res.json({
      success: true,
      listing: newListing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ success: false, error: 'Failed to create listing' });
  }
});

// Get listing details
router.get('/:listingId', (req, res) => {
  try {
    const { listingId } = req.params;
    
    if (!listings.has(listingId)) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    const listing = listings.get(listingId);
    
    // Increment view count
    listing.views += 1;
    listings.set(listingId, listing);
    
    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
});

// Save/unsave a listing
router.post('/:listingId/save', (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    if (!listings.has(listingId)) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    const listing = listings.get(listingId);
    const userSavedListings = savedListings.get(userId) || [];
    
    const isSaved = userSavedListings.includes(listingId);
    
    if (isSaved) {
      // Remove from saved
      const updatedSavedListings = userSavedListings.filter(id => id !== listingId);
      savedListings.set(userId, updatedSavedListings);
      listing.saves = Math.max(0, listing.saves - 1);
    } else {
      // Add to saved
      userSavedListings.push(listingId);
      savedListings.set(userId, userSavedListings);
      listing.saves += 1;
    }
    
    listings.set(listingId, listing);
    
    res.json({
      success: true,
      saved: !isSaved,
      saves: listing.saves
    });
  } catch (error) {
    console.error('Error saving listing:', error);
    res.status(500).json({ success: false, error: 'Failed to save listing' });
  }
});

// Get user's listings
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'created' } = req.query; // 'created' or 'saved'
    
    let userListingIds = [];
    
    if (type === 'created') {
      userListingIds = userListings.get(userId) || [];
    } else if (type === 'saved') {
      userListingIds = savedListings.get(userId) || [];
    }
    
    const userListingsList = userListingIds
      .map(listingId => listings.get(listingId))
      .filter(listing => listing)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      listings: userListingsList
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user listings' });
  }
});

// Update a listing
router.put('/:listingId', (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId, ...updates } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const listing = listings.get(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    if (listing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this listing' });
    }
    
    const updatedListing = {
      ...listing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    listings.set(listingId, updatedListing);
    
    res.json({
      success: true,
      listing: updatedListing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ success: false, error: 'Failed to update listing' });
  }
});

// Mark listing as sold
router.post('/:listingId/sold', (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const listing = listings.get(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    if (listing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to mark this listing as sold' });
    }
    
    listing.status = 'sold';
    listing.updatedAt = new Date().toISOString();
    
    listings.set(listingId, listing);
    
    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Error marking listing as sold:', error);
    res.status(500).json({ success: false, error: 'Failed to mark listing as sold' });
  }
});

// Delete a listing
router.delete('/:listingId', (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const listing = listings.get(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    if (listing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this listing' });
    }
    
    // Remove listing and related data
    listings.delete(listingId);
    
    // Remove from user's listings
    const userListingIds = userListings.get(userId) || [];
    const updatedUserListings = userListingIds.filter(id => id !== listingId);
    userListings.set(userId, updatedUserListings);
    
    // Remove from all users' saved listings
    for (const [savedUserId, savedListingIds] of savedListings.entries()) {
      const updatedSavedListings = savedListingIds.filter(id => id !== listingId);
      savedListings.set(savedUserId, updatedSavedListings);
    }
    
    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ success: false, error: 'Failed to delete listing' });
  }
});

// Get marketplace categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      { id: 'electronics', name: 'Electronics', emoji: '📱' },
      { id: 'furniture', name: 'Furniture', emoji: '🪑' },
      { id: 'clothing', name: 'Clothing', emoji: '👕' },
      { id: 'books', name: 'Books', emoji: '📚' },
      { id: 'sports', name: 'Sports & Outdoors', emoji: '⚽' },
      { id: 'vehicles', name: 'Vehicles', emoji: '🚗' },
      { id: 'services', name: 'Services', emoji: '🔧' },
      { id: 'food', name: 'Food & Beverages', emoji: '🍕' },
      { id: 'other', name: 'Other', emoji: '📦' }
    ];
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

module.exports = router; 