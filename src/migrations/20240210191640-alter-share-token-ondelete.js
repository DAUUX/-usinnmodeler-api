'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('share_token', 'share_token_ibfk_1');
        await queryInterface.addConstraint('share_token', {
            fields: ['diagram_id'],
            type: 'foreign key',
            name: 'share_token_ibfk_1',
            references: {
                table: 'diagram',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('share_token', 'share_token_ibfk_1');
        await queryInterface.addConstraint('share_token', {
            fields: ['diagram_id'],
            type: 'foreign key',
            name: 'share_token_ibfk_1',
            references: {
                table: 'diagram',
                field: 'id'
            },
        });
    }
};
