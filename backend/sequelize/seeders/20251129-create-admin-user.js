'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminEmail = 'admin@coderoom.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const [results] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = '${adminEmail}' LIMIT 1;`
    );

    if (!results || results.length === 0) {
      await queryInterface.bulkInsert('users', [
        {
          name: 'Administrador',
          email: adminEmail,
          password: hash,
          role: 'teacher',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log('Seeder: admin user created:', adminEmail);
    } else {
      console.log('Seeder: admin user already exists:', adminEmail);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'admin@coderoom.com' }, {});
  },
};
