"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper to check columns
    async function hasColumn(table, column) {
      try {
        const desc = await queryInterface.describeTable(table);
        return Object.prototype.hasOwnProperty.call(desc, column);
      } catch (e) {
        return false;
      }
    }

    // Rename class_sessions.classId -> class_group_id
    try {
      if (await hasColumn('class_sessions', 'classId') && !(await hasColumn('class_sessions', 'class_group_id'))) {
        await queryInterface.renameColumn('class_sessions', 'classId', 'class_group_id');
        console.log('Renamed class_sessions.classId -> class_group_id');
      }
    } catch (err) {
      console.warn('Could not rename class_sessions.classId:', err.message);
    }

    // Rename class_sessions.lessonId -> lesson_id
    try {
      if (await hasColumn('class_sessions', 'lessonId') && !(await hasColumn('class_sessions', 'lesson_id'))) {
        await queryInterface.renameColumn('class_sessions', 'lessonId', 'lesson_id');
        console.log('Renamed class_sessions.lessonId -> lesson_id');
      }
    } catch (err) {
      console.warn('Could not rename class_sessions.lessonId:', err.message);
    }

    // Rename projects.classId -> class_group_id
    try {
      if (await hasColumn('projects', 'classId') && !(await hasColumn('projects', 'class_group_id'))) {
        await queryInterface.renameColumn('projects', 'classId', 'class_group_id');
        console.log('Renamed projects.classId -> class_group_id');
      }
    } catch (err) {
      console.warn('Could not rename projects.classId:', err.message);
    }

    // Remove duplicate lesson FK if exists
    try {
      await queryInterface.removeConstraint('lessons', 'fk_lesson_class_group');
      console.log('Removed duplicate constraint fk_lesson_class_group on lessons');
    } catch (err) {
      // ignore if doesn't exist
    }

    // Add canonical FK constraints (idempotent)
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
    // revert renames where possible
    async function hasColumn(table, column) {
      try {
        const desc = await queryInterface.describeTable(table);
        return Object.prototype.hasOwnProperty.call(desc, column);
      } catch (e) {
        return false;
      }
    }

    try {
      if (await hasColumn('class_sessions', 'class_group_id') && !(await hasColumn('class_sessions', 'classId'))) {
        await queryInterface.renameColumn('class_sessions', 'class_group_id', 'classId');
      }
    } catch (err) {
      console.warn('Could not revert rename class_sessions.class_group_id:', err.message);
    }

    try {
      if (await hasColumn('class_sessions', 'lesson_id') && !(await hasColumn('class_sessions', 'lessonId'))) {
        await queryInterface.renameColumn('class_sessions', 'lesson_id', 'lessonId');
      }
    } catch (err) {
      console.warn('Could not revert rename class_sessions.lesson_id:', err.message);
    }

    try {
      if (await hasColumn('projects', 'class_group_id') && !(await hasColumn('projects', 'classId'))) {
        await queryInterface.renameColumn('projects', 'class_group_id', 'classId');
      }
    } catch (err) {
      console.warn('Could not revert rename projects.class_group_id:', err.message);
    }

    // Remove canonical FKs we may have added
    try { await queryInterface.removeConstraint('class_sessions', 'fk_sessions_class_group'); } catch (e) {}
    try { await queryInterface.removeConstraint('class_sessions', 'fk_sessions_lesson'); } catch (e) {}
    try { await queryInterface.removeConstraint('projects', 'fk_projects_class_group'); } catch (e) {}
  },
};
