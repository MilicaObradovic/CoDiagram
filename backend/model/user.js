const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // wont return pass in queries
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // for collaboration
  currentSession: {
    diagramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Diagram',
      default: null
    },
    joinedAt: {
      type: Date,
      default: null
    }
  },

}, {
  timestamps: true, // auto createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// num of diagrams user created
userSchema.virtual('diagramsCount', {
  ref: 'Diagram',
  localField: '_id',
  foreignField: 'createdBy',
  count: true
});

userSchema.virtual('collaborationsCount', {
  ref: 'Diagram',
  localField: '_id',
  foreignField: 'collaborators',
  count: true
});


// Middleware for hash password before save
userSchema.pre('save', async function(next) {
  // Hash password only if changed
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware for update lastActive
userSchema.pre('save', function(next) {
  if (this.isModified('lastActive')) {
    this.lastActive = new Date();
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateSession = function(diagramId = null) {
  this.currentSession = {
    diagramId: diagramId,
    joinedAt: diagramId ? new Date() : null
  };
  return this.save();
};

userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    lastActive: this.lastActive,
  };
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('User', userSchema);