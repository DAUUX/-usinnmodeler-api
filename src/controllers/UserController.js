const { body, validationResult } = require('express-validator');
const db = require("../database");
const User = db.user;
const bcrypt = require("bcryptjs");
const { handleExceptions } = require('../helpers');

module.exports = {

    get: {
        handler: async (req, res) => {

            try {
    
                const id = req.user_id;
    
                const user = await User.findOne({
                    where: {id},
                    attributes: ['name', 'email', 'role', 'company']
                });

                if (!user) { return res.status(404).json({errors: [{msg: "Usuário não encontrado"}]}); }
    
                return res.json(user);
    
            } catch (error) {
                return handleExceptions(error, res);
            }
            
        }
    },

    update: {
        validations: [
            body('name').isLength({ min: 3, max: 100 }).withMessage("O nome deve ter entre 3 e 100 caracteres").not().isEmpty().withMessage("Preencha o campo nome").isAlpha("pt-BR", {ignore:" "}).withMessage("O nome não deve conter caracteres especiais"),
            body('email').isLength({ min: 3, max: 100 }).withMessage("O email deve ter entre 3 e 100 caracteres").isEmail().withMessage("O campo deve ser um email válido").not().isEmpty().withMessage("Preencha o campo email"),
            body('password').isLength({ min: 8 }).withMessage("A senha deve ter no mínimo 8 caracteres").not().isEmpty().withMessage("Preencha o campo senha"),
            body('birthday').isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage("A data de nascimento deve ser uma data válida"),
            body('gender').isInt({ min: 1, max: 3 }).withMessage("O campo gênero é inválido"),
            body('company').isLength({ max: 100 }).withMessage("A empresa deve ter no máximo 100 caracteres"),
            body('role').isInt({ min: 1, max: 3 }).withMessage("O campo perfil é inválido"),
        ], 
        handler: async (req, res) => {
            
            try {

                const errors = validationResult(req);
                if (!errors.isEmpty()) 
                    throw {name: 'RequestValidationError', errors};

                const id = req.user_id;

                const { name, email, password, birthday, gender, company, role } = req.body;

                const user = await User.update({ name, email, password: bcrypt.hashSync(password, 8), birthday, gender, company, role }, {
                    where: { id }
                });

                return res.status(200).send();

            } catch (error) {
                return handleExceptions(error, res);
            }
        }
    },

    checkPassord: {
        validations: [
            body('password').isLength({ min: 8 }).withMessage("A senha deve ter no mínimo 8 carcteres").not().isEmpty().withMessage("Preencha o campo senha"),
        ],
        handler: async (req, res) => {

            try {

                const errors = validationResult(req);
                if(!errors.isEmpty())
                    throw {name: "RequestValidationError", errors};

                const {password} = req.body;

                const id = req.user_id;
                const user = await User.findByPk(id);

                const compare = bcrypt.compareSync(password, user.password);

                if(compare){
                    return res.status(204).send();
                }
                return res.status(406).json({errors: [{msg: "A senha digitada não corresponde a senha cadastrada!"}]});

            } catch (error) {
                return handleExceptions(error, res);
            }
        }
    },

    delete: {
        handler: async (req, res) => {
    
            try {
    
                const id = req.user_id;
    
                await User.destroy({ where: {id} });
    
                return res.status(204).send();
    
            } catch (error) {
                return handleExceptions(error, res);
            }
            
        }
    }

}
