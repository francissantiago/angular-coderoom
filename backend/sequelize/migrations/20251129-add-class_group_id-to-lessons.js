"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add class_group_id column (nullable) and FK to class_groups
    try {
      await queryInterface.addColumn('lessons', 'class_group_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    } catch (err) {
      console.warn('Could not add column lessons.class_group_id:', err.message);
    }

    try {
      await queryInterface.addConstraint('lessons', {
        fields: ['class_group_id'],
        type: 'foreign key',
        name: 'fk_lesson_class_group',
        references: { table: 'class_groups', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_lesson_class_group:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('lessons', 'fk_lesson_class_group');
    } catch (err) {
      // ignore
    }
    try {
      await queryInterface.removeColumn('lessons', 'class_group_id');
    } catch (err) {
      // ignore
    }
  }
};
