import mongoose, { Schema, models } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [3, 'ユーザー名は3文字以上である必要があります'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '有効なメールアドレスを入力してください'],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'パスワードは6文字以上である必要があります'],
    },
    isAI: {
      type: Boolean,
      default: false,
    },
    aiPersonality: {
      type: String,
      enum: ['citizen', 'expert', 'trainer'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// パスワードをハッシュ化
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// パスワードをチェック
UserSchema.methods.comparePassword = async function (password: string) {
  console.log('[User.comparePassword] Plain password received:', password);
  console.log('[User.comparePassword] Hashed password (this.password):', this.password);

  // ★★★ 文字コードレベルでのデバッグログ ★★★
  try {
    const plainCodes = password ? Array.from(password).map(c => c.charCodeAt(0)).join(' ') : 'null';
    const hashCodes = this.password ? Array.from(this.password).map(c => c.charCodeAt(0)).join(' ') : 'null';
    console.log('[User.comparePassword] Plain char codes:', plainCodes);
    console.log('[User.comparePassword] Hash char codes:', hashCodes);
  } catch (e) {
    console.error('[User.comparePassword] Error getting char codes:', e);
  }
  // ★★★ ------------- ★★★

  return await bcrypt.compare(password, this.password);
};

const User = models.User || mongoose.model('User', UserSchema);

export default User; 