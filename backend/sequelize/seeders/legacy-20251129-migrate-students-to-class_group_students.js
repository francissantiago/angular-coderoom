"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Read class_groups with studentIds JSON and populate join table
    const rows = await queryInterface.sequelize.query(
      `SELECT id, studentIds FROM class_groups WHERE JSON_LENGTH(studentIds) IS NOT NULL AND JSON_LENGTH(studentIds) > 0`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const r of rows) {
      let ids = [];
      try {
        ids = JSON.parse(r.studentIds || '[]');
      } catch (e) {
        // if stored as native JSON, it may already be parsed
        ids = r.studentIds || [];
      }
      for (const sid of ids) {
        // Insert if not exists
        await queryInterface.sequelize.query(
          `INSERT IGNORE INTO class_group_students (class_group_id, student_id, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`,
          { replacements: [r.id, sid] }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove entries that can be traced back to class_groups.studentIds
    const rows = await queryInterface.sequelize.query(
      `SELECT id, studentIds FROM class_groups WHERE JSON_LENGTH(studentIds) IS NOT NULL AND JSON_LENGTH(studentIds) > 0`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    for (const r of rows) {
      let ids = [];
      try {
        ids = JSON.parse(r.studentIds || '[]');
      } catch (e) {
        ids = r.studentIds || [];
      }
      for (const sid of ids) {
        await queryInterface.sequelize.query(
          `DELETE FROM class_group_students WHERE class_group_id = ? AND student_id = ?`,
          { replacements: [r.id, sid] }
        );
      }
    }
  }
};
