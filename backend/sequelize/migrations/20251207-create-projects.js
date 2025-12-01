"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      class_group_id: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    try {
      await queryInterface.addConstraint('projects', {
        fields: ['class_group_id'],
        type: 'foreign key',
        name: 'fk_projects_class_group',
        references: { table: 'class_groups', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_projects_class_group:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeConstraint('projects', 'fk_projects_class_group'); } catch (e) {}
    await queryInterface.dropTable('projects');
  },
};
