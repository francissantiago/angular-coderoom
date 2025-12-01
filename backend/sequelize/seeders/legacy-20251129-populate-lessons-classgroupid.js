"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // For each class_group that has lessons JSON, try to set lessons.class_group_id for matching lesson ids
    const rows = await queryInterface.sequelize.query(
      `SELECT id, lessons FROM class_groups WHERE JSON_LENGTH(lessons) IS NOT NULL AND JSON_LENGTH(lessons) > 0`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const r of rows) {
      let lessons = [];
      try {
        lessons = JSON.parse(r.lessons || '[]');
      } catch (e) {
        lessons = r.lessons || [];
      }
      for (const l of lessons) {
        if (!l || !l.id) continue;
        await queryInterface.sequelize.query(
          `UPDATE lessons SET class_group_id = ? WHERE id = ?`,
          { replacements: [r.id, l.id] }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert class_group_id set by this seeder
    const rows = await queryInterface.sequelize.query(
      `SELECT id, lessons FROM class_groups WHERE JSON_LENGTH(lessons) IS NOT NULL AND JSON_LENGTH(lessons) > 0`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    for (const r of rows) {
      let lessons = [];
      try {
        lessons = JSON.parse(r.lessons || '[]');
      } catch (e) {
        lessons = r.lessons || [];
      }
      for (const l of lessons) {
        if (!l || !l.id) continue;
        await queryInterface.sequelize.query(
          `UPDATE lessons SET class_group_id = NULL WHERE id = ? AND class_group_id = ?`,
          { replacements: [l.id, r.id] }
        );
      }
    }
  }
};
