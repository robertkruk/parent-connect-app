import { db } from './database/index.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Seeding database with demo data...');

  try {
    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const sarah = db.createUser({
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      password: hashedPassword,
      phone: '+1-555-0123',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isVerified: true
    });

    const michael = db.createUser({
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      password: hashedPassword,
      phone: '+1-555-0124',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isVerified: true
    });

    const emily = db.createUser({
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      password: hashedPassword,
      phone: '+1-555-0125',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isVerified: true
    });

    const david = db.createUser({
      name: 'David Thompson',
      email: 'david.thompson@email.com',
      password: hashedPassword,
      phone: '+1-555-0126',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isVerified: true
    });

    const lisa = db.createUser({
      name: 'Lisa Wang',
      email: 'lisa.wang@email.com',
      password: hashedPassword,
      phone: '+1-555-0127',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      isVerified: true
    });

    console.log('✅ Created demo users');

    // Create demo children
    const emma = db.createChild({
      name: 'Emma Johnson',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: sarah.id,
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop&crop=face'
    });

    const alex = db.createChild({
      name: 'Alex Chen',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: michael.id,
      avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150&h=150&fit=crop&crop=face'
    });

    const sophia = db.createChild({
      name: 'Sophia Rodriguez',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: emily.id,
      avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150&h=150&fit=crop&crop=face'
    });

    const james = db.createChild({
      name: 'James Thompson',
      grade: '4th Grade',
      school: 'Lincoln Elementary',
      parentId: david.id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    });

    const mia = db.createChild({
      name: 'Mia Wang',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: lisa.id,
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop&crop=face'
    });

    console.log('✅ Created demo children');

    // Create demo classes
    const thirdGrade = db.createClass({
      name: "Mrs. Smith's 3rd Grade",
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      teacher: 'Mrs. Sarah Smith',
      description: 'Welcome to 3rd Grade! We have an exciting year ahead.'
    });

    const fourthGrade = db.createClass({
      name: "Mr. Davis's 4th Grade",
      grade: '4th Grade',
      school: 'Lincoln Elementary',
      teacher: 'Mr. Robert Davis',
      description: 'Welcome to 4th Grade! Let\'s make this year amazing.'
    });

    console.log('✅ Created demo classes');

    // Create demo chats
    const thirdGradeChat = db.createChat({
      name: "Mrs. Smith's 3rd Grade",
      type: 'class',
      classId: thirdGrade.id,
      participants: [sarah.id, michael.id, emily.id, lisa.id]
    });

    const fourthGradeChat = db.createChat({
      name: "Mr. Davis's 4th Grade",
      type: 'class',
      classId: fourthGrade.id,
      participants: [david.id]
    });

    const directChat = db.createChat({
      name: 'Sarah Johnson',
      type: 'direct',
      participants: [sarah.id, michael.id]
    });

    console.log('✅ Created demo chats');

    // Create demo messages
    db.createMessage({
      content: "Hi everyone! I'm Emma's mom. Looking forward to connecting with other parents this year!",
      senderId: sarah.id,
      chatId: thirdGradeChat.id,
      type: 'text'
    });

    db.createMessage({
      content: "Hello! I'm Alex's dad. Nice to meet everyone!",
      senderId: michael.id,
      chatId: thirdGradeChat.id,
      type: 'text'
    });

    db.createMessage({
      content: "Hi! Sophia's mom here. Does anyone know if the field trip permission slips are due this week?",
      senderId: emily.id,
      chatId: thirdGradeChat.id,
      type: 'text'
    });

    db.createMessage({
      content: "Welcome to 4th Grade! I'm James's dad. Looking forward to a great year!",
      senderId: david.id,
      chatId: fourthGradeChat.id,
      type: 'text'
    });

    console.log('✅ Created demo messages');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('• sarah.johnson@email.com / password123');
    console.log('• michael.chen@email.com / password123');
    console.log('• emily.rodriguez@email.com / password123');
    console.log('• david.thompson@email.com / password123');
    console.log('• lisa.wang@email.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
