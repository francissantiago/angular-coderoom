"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('class_sessions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING },
      date: { type: Sequelize.DATE, allowNull: false },
      class_group_id: { type: Sequelize.INTEGER, allowNull: true },
      lesson_id: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    try {
      await queryInterface.addConstraint('class_sessions', {
        fields: ['class_group_id'],
        type: 'foreign key',
        name: 'fk_sessions_class_group',
        references: { table: 'class_groups', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_sessions_class_group:', err.message);
    }

    try {
      await queryInterface.addConstraint('class_sessions', {
        fields: ['lesson_id'],
        type: 'foreign key',
        name: 'fk_sessions_lesson',
        references: { table: 'lessons', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_sessions_lesson:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeConstraint('class_sessions', 'fk_sessions_class_group'); } catch(e) {}
    try { await queryInterface.removeConstraint('class_sessions', 'fk_sessions_lesson'); } catch(e) {}
    await queryInterface.dropTable('class_sessions');
  },
};
