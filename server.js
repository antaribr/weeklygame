const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// إعداد Socket.IO مع السماح بالاتصال من أي نطاق
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let players = []; // مصفوفة لحفظ بيانات اللاعبين

io.on('connection', (socket) => {
  console.log('مستخدم جديد اتصل:', socket.id);

  // عندما يسجل مستخدم اسمه
  socket.on('register', (name) => {
    // التحقق من عدم تخطي الحد الأقصى (17)
    if (players.length >= 17) {
        socket.emit('error_message', 'عذراً، اكتمل العدد (17 مشارك).');
        return;
    }
    
    players.push({ id: socket.id, name: name, number: null });
    io.emit('update_admin', players); // تحديث شاشة الإدمن
    socket.emit('registered_successfully');
  });

  // عندما يضغط الإدمن على زر التوزيع
  socket.on('shuffle_numbers', () => {
    let numbers = Array.from({ length: 17 }, (_, i) => i + 1);
    
    // خلط الأرقام عشوائياً
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // توزيع الأرقام على اللاعبين المسجلين حالياً
    players.forEach((player, index) => {
      player.number = numbers[index];
      // إرسال الرقم المخصص لكل لاعب
      io.to(player.id).emit('your_number', player.number);
    });

    // إرسال النتيجة النهائية للإدمن
    io.emit('update_admin', players);
  });

  // عند خروج لاعب
  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('update_admin', players);
    console.log('مستخدم غادر:', socket.id);
  });
});

// إعداد المنفذ الخاص بـ Railway
// تحديد البورت 8080 أو البورت الذي تفرضه المنصة السحابية
const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`الخادم يعمل بنجاح على البورت ${PORT}`);
});
