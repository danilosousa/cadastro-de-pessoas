package com.example.prova.auth;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;

/** Emite tokens JWT assinados com HS256. A validação fica com o resource server (SegurancaConfig). */
@Service
public class TokenService {

    public static final String EMISSOR = "prova-fullstack";

    private final JwtEncoder encoder;
    private final AuthProperties props;
    private final Clock relogio;

    public TokenService(JwtEncoder encoder, AuthProperties props) {
        this.encoder = encoder;
        this.props = props;
        this.relogio = Clock.systemUTC();
    }

    /** Token emitido e o instante em que expira. */
    public record TokenEmitido(String valor, Instant expiraEm) {
    }

    public TokenEmitido emitir(String usuario) {
        Instant agora = relogio.instant();
        Instant expiraEm = agora.plus(props.jwt().expiracao());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(EMISSOR)
                .subject(usuario)
                .issuedAt(agora)
                .expiresAt(expiraEm)
                .build();
        JwsHeader cabecalho = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(cabecalho, claims)).getTokenValue();
        return new TokenEmitido(token, expiraEm);
    }
}
