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
    select: false // Ne vraća password u query-ima
  },
  
  avatar: {
    type: String,
    default: null
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Za kolaboraciju - trenutno aktivni dijagrami
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
  
  // Preferences korisnika
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    defaultDiagramType: {
      type: String,
      enum: ['flowchart', 'uml', 'mindmap', 'custom'],
      default: 'flowchart'
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  }

}, {
  timestamps: true, // Automatski dodaje createdAt i updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual polje za broj dijagrama koje je kreirao korisnik
userSchema.virtual('diagramsCount', {
  ref: 'Diagram',
  localField: '_id',
  foreignField: 'createdBy',
  count: true
});

// Virtual polje za kolaboracije
userSchema.virtual('collaborationsCount', {
  ref: 'Diagram',
  localField: '_id',
  foreignField: 'collaborators',
  count: true
});


// Middleware za hash password pre čuvanja
userSchema.pre('save', async function(next) {
  // Hash password samo ako je modifikovan
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware za update lastActive
userSchema.pre('save', function(next) {
  if (this.isModified('lastActive')) {
    this.lastActive = new Date();
  }
  next();
});

// Metoda za proveru password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Metoda za update aktivne sesije
userSchema.methods.updateSession = function(diagramId = null) {
  this.currentSession = {
    diagramId: diagramId,
    joinedAt: diagramId ? new Date() : null
  };
  return this.save();
};

// Metoda za dobijanje osnovnih podataka (bez osetljivih)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    lastActive: this.lastActive,
    preferences: this.preferences
  };
};

// Statička metoda za pronalaženje po emailu (sa password-om za login)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('User', userSchema);