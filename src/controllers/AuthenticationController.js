const { body, validationResult } = require('express-validator');
const db = require("../database");
const User = db.user;
const RecoverToken = db.recoverToken;
const jwt = require("jsonwebtoken");
const auth = require("../config/auth");
const bcrypt = require("bcryptjs");
const _pick = require("lodash/pick");
const { handleExceptions } = require('../helpers');
const { resetPasswordMail } = require('../config/mail');


module.exports = {

    signup: {
        validations: [
            body('name').isLength({ min: 3, max: 100 }).withMessage("O nome deve ter entre 3 e 100 caracteres").not().isEmpty().withMessage("Preencha o campo nome").isAlpha("pt-BR", {ignore:" "}).withMessage("O nome não deve conter caracteres especiais"),
            body('email').isLength({ max: 255 }).withMessage("O email deve ter menos de 255 caracteres").isEmail().withMessage("O campo deve ser um email válido").not().isEmpty().withMessage("Preencha o campo email"),
            body('password').isLength({ min: 8 }).withMessage("A senha deve ter no mínimo 8 caracteres").not().isEmpty().withMessage("Preencha o campo senha"),
            body('birthday').isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage("A data de nascimento deve ser uma data válida"),
            body('gender').isInt({ min: 1, max: 3 }).withMessage("O campo gênero é inválido"),
            body('company').isLength({ max: 100 }).withMessage("A empresa deve ter no máximo 100 caracteres"),
            body('role').isInt({ min: 1, max: 3 }).withMessage("O campo perfil é inválido"),
            body('accept').equals("true").withMessage("Você deve aceitar os termos de uso"),
        ], 
        handler: async (req, res) => {
            
            try {

                const errors = validationResult(req);
                if (!errors.isEmpty()) 
                    throw {name: 'RequestValidationError', errors};

                const { name, email, password, birthday, gender, company, role } = req.body;

                const user = await User.create({ name, email, password: bcrypt.hashSync(password, 8), birthday, gender, company, role, avatar:1 });
                return res.json(_pick(user, ["name", "email"]));

            } catch (error) {
                return handleExceptions(error, res);
            }
        }
    },

    signin: {
        validations: [
            body('email').isLength({ max: 255 }).withMessage("O email deve ter menos de 255 caracteres").isEmail().withMessage("O campo deve ser um email válido").not().isEmpty().withMessage("Preencha o campo email"),
            body('password').isLength({ min: 8 }).withMessage("A senha deve ter no mínimo 8 caracteres").not().isEmpty().withMessage("Preencha o campo senha"),
        ],
        handler: async (req, res) => {

            try {

                const errors = validationResult(req);
                if (!errors.isEmpty())
                    throw { name: 'RequestValidationError', errors };

                const { email, password } = req.body;
                
                // check if user exists
                const user = await User.findOne({
                    where: {email}
                });

                if (!user)
                    return res.status(404).json({ errors: [{ msg: "E-mail ou senha inválidos"}] });

                // check credentials
                let passwordIsValid = bcrypt.compareSync(password, user.password);

                if (!passwordIsValid)
                    return res.status(401).json({ errors: [{ msg: "E-mail ou senha inválidos" }] });

                // creating access token
                let token = jwt.sign({ id: user.id }, auth.secret, {
                    expiresIn: 86400 // 24 hours
                });

                res.status(200).json({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    token: token,
                    avatar: user.avatar
                });

            } catch (error) {
                return handleExceptions(error, res);
            }
        }
    },

    passwordRecovery: {
        validations: [
            body('email').isLength({ max: 255 }).withMessage("O email deve ter menos de 255 caracteres").isEmail().withMessage("O campo deve ser um email válido").not().isEmpty().withMessage("Preencha o campo email")
        ], 
        handler: async (req, res) => {
            
            try {

                const errors = validationResult(req);
                if (!errors.isEmpty()) 
                    throw {name: 'RequestValidationError', errors};

                const { email } = req.body;

                const user = await User.findOne({
                    where: {email}
                });

                if (!user)
                    return res.status(404).json({ errors: [{ msg: "Email não cadastrado!"}] });

                let token = jwt.sign({ user_id: user.id }, auth.secret, { expiresIn: '1h' });

                let recover_token = await RecoverToken.findOrCreate({where: { user_id: user.id }, defaults: { token: token, user_id: user.id }})

                await resetPasswordMail(user.email, recover_token[0].token);

                return res.status(200).send("O email com as instruções para recuperação de senha foi enviado");

            } catch (error) {
                return handleExceptions(error, res);
            }
        }
    },

    passwordReset: {
        validations: [
            body('password').isLength({ min: 8 }).withMessage("A senha deve ter no mínimo 8 caracteres").not().isEmpty().withMessage("Preencha o campo senha"),
            body('token').not().isEmpty().withMessage("Token de recuperação é requerido")
        ], 
        handler: async (req, res) => {

            const { password, token } = req.body;
            
            try {

                const errors = validationResult(req);
                if (!errors.isEmpty()) 
                    throw {name: 'RequestValidationError', errors};
                
                let { user_id } = jwt.verify(token, auth.secret);
                
                const recover_token = await RecoverToken.findOne({
                    where: {token, user_id}
                });

                if (!recover_token)
                    return res.status(404).json({ errors: [{ msg: "Token de recuperação inválido!"}] });
                // Verifica se a nova senha é igual à senha anterior
                const user = await User.findByPk(user_id);
                const compare = bcrypt.compareSync(password, user.password);

                if (compare) {
                return res.status(406).json({ errors: [{ msg: "A nova senha não pode ser igual à senha anterior!" }] });
                }

                // Atualiza a senha se for diferente
                await User.update({ password: bcrypt.hashSync(password, 8) }, {
                    where: { id: user_id }
                });

                // Destruir o token apenas se a senha for alterada com sucesso
                RecoverToken.destroy({where: {token}});

                return res.status(200).send("Senha redefinida com sucesso!")

            } catch (error) {
                return handleExceptions(error, res);
            } 
        }
    },

}