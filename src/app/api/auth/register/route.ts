import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Use the Mongoose connection helper
import UserModel from '@/models/User'; // Your User model

export async function POST(req: NextRequest) {
  try {
    await dbConnect(); // Ensure Mongoose connection is established

    const { email, password, name } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'メールアドレスとパスワードは必須です。' },
        { status: 400 }
      );
    }

     // More robust email validation (optional but recommended)
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) {
       return NextResponse.json({ message: '無効なメールアドレス形式です。' }, { status: 400 });
     }

     // Password strength validation (optional but recommended)
     if (password.length < 6) {
        return NextResponse.json({ message: 'パスワードは6文字以上である必要があります。'}, { status: 400 });
     }


    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'このメールアドレスは既に使用されています。' },
        { status: 409 } // 409 Conflict
      );
    }

    // Create new user instance (password will be hashed by the pre-save hook in User model)
    const newUser = new UserModel({
      email,
      password, // Pass plain password, hashing happens on save
      name: name || email.split('@')[0], // Optional: Set name, default to part before @
    });

    // Save the new user
    await newUser.save();

    console.log(`User registered successfully: ${email}`);

    // Return success response (don't return the user object directly for security)
    return NextResponse.json(
      { message: 'ユーザー登録が成功しました。ログインしてください。' },
      { status: 201 } // 201 Created
    );

  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'サーバーエラーが発生しました。';
    let statusCode = 500;

     // Handle potential Mongoose validation errors specifically
     if (error instanceof Error && error.name === 'ValidationError') {
         errorMessage = '入力データが無効です。'; // Or parse specific field errors
         statusCode = 400;
     }

    return NextResponse.json(
      { message: errorMessage },
      { status: statusCode }
    );
  }
} 