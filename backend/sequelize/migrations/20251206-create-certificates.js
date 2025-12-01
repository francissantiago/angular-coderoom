/* eslint-disable no-console */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'certificates';
    const sequelize = queryInterface.sequelize;

    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates'",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!tableExists || tableExists[0].cnt === 0) {
      // Create table if it doesn't exist
      await queryInterface.createTable(table, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        issueDate: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        validationCode: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        studentId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        class_group_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      }, { charset: 'utf8mb4' });

      console.log(`Created table ${table}`);

      // Add FKs for new table
      try {
        await queryInterface.addConstraint(table, {
          fields: ['studentId'],
          type: 'foreign key',
          name: 'fk_certificates_student',
          references: {
            table: 'students',
            field: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      } catch (err) {
        console.warn('Could not add FK fk_certificates_student:', err.message);
      }

      try {
        await queryInterface.addConstraint(table, {
          fields: ['class_group_id'],
          type: 'foreign key',
          name: 'fk_certificates_class_group',
          references: {
            table: 'class_groups',
            field: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      } catch (err) {
        console.warn('Could not add FK fk_certificates_class_group:', err.message);
      }
    } else {
      // Table exists - just add column if needed
      const column = 'class_group_id';

      const columnExists = await sequelize.query(
        "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = '" + column + "'",
        { type: sequelize.QueryTypes.SELECT }
      );

      if (!columnExists || columnExists[0].cnt === 0) {
        await queryInterface.addColumn(table, column, {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
        console.log(`Added column ${table}.${column}`);
      } else {
        console.log(`Column ${table}.${column} already exists, skipping addColumn`);
      }

      // If there are legacy columns like classGroupId or classId, copy values
      const hasClassGroupId = await sequelize.query(
        "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'classGroupId'",
        { type: sequelize.QueryTypes.SELECT }
      );

      if (hasClassGroupId && hasClassGroupId[0].cnt > 0) {
        await sequelize.query(`UPDATE \`${table}\` SET \`${column}\` = \`classGroupId\` WHERE \`classGroupId\` IS NOT NULL`);
        console.log(`Populated ${table}.${column} from legacy column classGroupId`);
      } else {
        const hasClassId = await sequelize.query(
          "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'classId'",
          { type: sequelize.QueryTypes.SELECT }
        );
        if (hasClassId && hasClassId[0].cnt > 0) {
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
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'certificates';

    try {
      await queryInterface.dropTable(table);
      console.log(`Dropped table ${table}`);
    } catch (err) {
      console.warn(`Could not drop table ${table}:`, err.message);
    }
  },
};

