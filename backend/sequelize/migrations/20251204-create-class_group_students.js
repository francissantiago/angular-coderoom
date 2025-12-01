"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('class_group_students', {
      class_group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, { charset: 'utf8mb4' });

    // Add foreign keys (will fail if types incompatible)
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

    // Add unique key for (class_group_id, student_id)
    await queryInterface.addConstraint('class_group_students', {
      fields: ['class_group_id', 'student_id'],
      type: 'unique',
      name: 'uniq_class_group_student'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('class_group_students');
  }
};
