"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      enrollmentNumber: { type: Sequelize.STRING, allowNull: true },
      birthDate: { type: Sequelize.DATEONLY, allowNull: true },
      password: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('students');
  },
};
