'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('diagram', 'diagram_ibfk_1');

        // Adição da nova restrição de chave estrangeira com ON DELETE CASCADE
        await queryInterface.addConstraint('diagram', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'diagram_ibfk_1',
            references: {
                table: 'user',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('diagram', 'diagram_ibfk_1');

        await queryInterface.addConstraint('diagram', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'diagram_ibfk_1',
            references: {
                table: 'user',
                field: 'id'
            }
        });
    }
};

