const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// مسار للتأكد من أن الخادم يعمل عند فتح الرابط في المتصفح
app.get('/', (req, res) => {
    res.send('الخادم يعمل بنجاح ومستعد للعبة! 🚀');
});

const server = http.createServer(app);

// إعداد Socket.IO مع السماح بالاتصال من أي مكان
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let players = []; // مصفوفة لحفظ بيانات اللاعبين

io.on('connection', (socket) => {
  console.log('مستخدم جديد اتصل:', socket.id);

  // تسجيل اللاعب
  socket.on('register', (name) => {
    if (players.length >= 17) {
        socket.emit('error_message', 'عذراً، اكتمل العدد (17 مشارك).');
        return;
    }
    
    players.push({ id: socket.id, name: name, number: null });
    io.emit('update_admin', players); // تحديث شاشة الإدمن
    socket.emit('registered_successfully');
  });

  // توزيع الأرقام
  socket.on('shuffle_numbers', () => {
    let numbers = Array.from({ length: 17 }, (_, i) => i + 1);
    
    // خلط الأرقام عشوائياً
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    players.forEach((player, index) => {
      player.number = numbers[index];
      io.to(player.id).emit('your_number', player.number);
    });

    io.emit('update_admin', players);
  });

  // مغادرة اللاعب
  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('update_admin', players);
    console.log('مستخدم غادر:', socket.id);
  });
});

// استخدام البورت 8080 بناءً على متطلبات المنصة
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`الخادم يعمل بنجاح على البورت ${PORT}`);
});
