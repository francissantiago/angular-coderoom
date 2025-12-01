"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'observation' column
    await queryInterface.addColumn('class_sessions', 'observation', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add 'presentStudentIds' column
    await queryInterface.addColumn('class_sessions', 'presentStudentIds', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('class_sessions', 'presentStudentIds');
    await queryInterface.removeColumn('class_sessions', 'observation');
  },
};