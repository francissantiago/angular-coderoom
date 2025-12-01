"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename 'title' to 'name'
    await queryInterface.renameColumn('projects', 'title', 'name');

    // Add 'teacherCode' column
    await queryInterface.addColumn('projects', 'teacherCode', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // Add 'studentSubmissions' column
    await queryInterface.addColumn('projects', 'studentSubmissions', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('projects', 'studentSubmissions');
    await queryInterface.removeColumn('projects', 'teacherCode');

    // Rename 'name' back to 'title'
    await queryInterface.renameColumn('projects', 'name', 'title');
  },
};