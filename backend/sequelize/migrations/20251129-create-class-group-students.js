"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('class_group_students', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      class_group_id: { type: Sequelize.INTEGER, allowNull: false },
      student_id: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    try {
      await queryInterface.addConstraint('class_group_students', {
        fields: ['class_group_id'],
        type: 'foreign key',
        name: 'fk_cgs_class_group',
        references: { table: 'class_groups', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_cgs_class_group:', err.message);
    }

    try {
      await queryInterface.addConstraint('class_group_students', {
        fields: ['student_id'],
        type: 'foreign key',
        name: 'fk_cgs_student',
        references: { table: 'students', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_cgs_student:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeConstraint('class_group_students', 'fk_cgs_class_group'); } catch (e) {}
    try { await queryInterface.removeConstraint('class_group_students', 'fk_cgs_student'); } catch (e) {}
    await queryInterface.dropTable('class_group_students');
  },
};
