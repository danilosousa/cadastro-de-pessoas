package com.example.prova.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Confere usuário e senha e, se baterem, emite um token. */
@Service
public class AuthService {

    /**
     * Hash BCrypt de uma senha qualquer. Quando o usuário não existe, comparamos
     * a senha com ele mesmo assim: a resposta leva o mesmo tempo que uma senha errada,
     * e um atacante não consegue descobrir usuários válidos medindo o tempo.
     */
    private final String hashFalso;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, TokenService tokens) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.tokens = tokens;
        this.hashFalso = encoder.encode("senha-que-nunca-sera-usada");
    }

    @Transactional(readOnly = true)
    public TokenService.TokenEmitido login(String usuario, String senha) {
        String hash = usuarios.findByUsuario(usuario).map(Usuario::getSenhaHash).orElse(null);
        boolean senhaConfere = encoder.matches(senha, hash != null ? hash : hashFalso);
        if (hash == null || !senhaConfere) {
            throw new CredenciaisInvalidasException();
        }
        return tokens.emitir(usuario);
    }
}
