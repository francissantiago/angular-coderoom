"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      class_session_id: { type: Sequelize.INTEGER, allowNull: false },
      student_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'present' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    try {
      await queryInterface.addConstraint('attendances', {
        fields: ['class_session_id'],
        type: 'foreign key',
        name: 'fk_attendances_session',
        references: { table: 'class_sessions', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_attendances_session:', err.message);
    }

    try {
      await queryInterface.addConstraint('attendances', {
        fields: ['student_id'],
        type: 'foreign key',
        name: 'fk_attendances_student',
        references: { table: 'students', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    } catch (err) {
      console.warn('Could not add fk_attendances_student:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeConstraint('attendances', 'fk_attendances_session'); } catch(e) {}
    try { await queryInterface.removeConstraint('attendances', 'fk_attendances_student'); } catch(e) {}
    await queryInterface.dropTable('attendances');
  },
};
