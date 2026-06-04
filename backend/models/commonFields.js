const commonFields = {
  created_by: {
    type: String,
    trim: true,
    default: null,
  },
  updated_by: {
    type: String,
    trim: true,
    default: null,
  },
};

const schemaOptions = {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  versionKey: false,
};

module.exports = {
  commonFields,
  schemaOptions,
};
