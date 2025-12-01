"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('class_groups', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      schedule: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('class_groups');
  },
};
