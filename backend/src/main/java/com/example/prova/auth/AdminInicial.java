package com.example.prova.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ao subir a aplicação, cria o usuário administrador (ADMIN_USUARIO / ADMIN_SENHA)
 * se ele ainda não existir. Se já existir, não mexe — a senha não é sobrescrita.
 */
@Component
class AdminInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final AuthProperties props;

    AdminInicial(UsuarioRepository usuarios, PasswordEncoder encoder, AuthProperties props) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String usuario = props.admin().usuario();
        if (!usuarios.existsByUsuario(usuario)) {
            usuarios.save(new Usuario(usuario, encoder.encode(props.admin().senha())));
            log.info("Usuário administrador '{}' criado", usuario);
        }
    }
}
