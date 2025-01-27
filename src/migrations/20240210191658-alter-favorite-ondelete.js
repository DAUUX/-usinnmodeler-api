'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('favorite', 'favorite_ibfk_2');

        // Adição da nova restrição de chave estrangeira com ON DELETE CASCADE
        await queryInterface.addConstraint('favorite', {
            fields: ['diagram_id'],
            type: 'foreign key',
            name: 'favorite_ibfk_2',
            references: {
                table: 'diagram',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('favorite', 'favorite_ibfk_2');
        await queryInterface.addConstraint('favorite', {
            fields: ['diagram_id'],
            type: 'foreign key',
            name: 'favorite_ibfk_2',
            references: {
                table: 'diagram',
                field: 'id'
            },
        });
    }
};
