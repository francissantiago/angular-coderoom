/* eslint-disable no-console */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'certificates';
    const column = 'class_group_id';
    const sequelize = queryInterface.sequelize;

    // Add column if it doesn't exist
    const [[{ cnt: exists }]] = await sequelize.query(
      "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = '" + column + "'"
    );

    if (!exists) {
      await queryInterface.addColumn(table, column, {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      console.log(`Added column ${table}.${column}`);
    } else {
      console.log(`Column ${table}.${column} already exists, skipping addColumn`);
    }

    // If there are legacy columns like classGroupId or classId, copy values
    const [[{ cnt: hasClassGroupId }]] = await sequelize.query(
      "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'classGroupId'"
    );

    if (hasClassGroupId) {
      await sequelize.query(`UPDATE \`${table}\` SET \`${column}\` = \`classGroupId\` WHERE \`classGroupId\` IS NOT NULL`);
      console.log(`Populated ${table}.${column} from legacy column classGroupId`);
    } else {
      const [[{ cnt: hasClassId }]] = await sequelize.query(
        "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'classId'"
      );
      if (hasClassId) {
        await sequelize.query(`UPDATE \`${table}\` SET \`${column}\` = \`classId\` WHERE \`classId\` IS NOT NULL`);
        console.log(`Populated ${table}.${column} from legacy column classId`);
      }
    }

    // Add foreign key constraint (idempotent)
    try {
      await queryInterface.addConstraint(table, {
        fields: [column],
        type: 'foreign key',
        name: 'fk_certificates_class_group',
        references: {
          table: 'class_groups',
          field: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      console.log('Added FK fk_certificates_class_group');
    } catch (err) {
      console.warn('Could not add FK fk_certificates_class_group (might already exist):', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'certificates';
    const column = 'class_group_id';
    const sequelize = queryInterface.sequelize;

    // Remove constraint if exists
    try {
      await queryInterface.removeConstraint(table, 'fk_certificates_class_group');
      console.log('Removed FK fk_certificates_class_group');
    } catch (err) {
      console.warn('FK fk_certificates_class_group not present or could not be removed:', err.message);
    }

    // Drop column if exists
    const [[{ cnt: exists }]] = await sequelize.query(
      "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = '" + column + "'"
    );
    if (exists) {
      await queryInterface.removeColumn(table, column);
      console.log(`Removed column ${table}.${column}`);
    } else {
      console.log(`Column ${table}.${column} does not exist, skipping removeColumn`);
    }
  },
};
