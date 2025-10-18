import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../../../database/entities/core/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'defaultSecret'),
    });
  }

  async validate(payload: any) {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub, deleted_at: IsNull() },
      relations: [
        'roles',
        'roles.role',
        'roles.role.permissions',
        'roles.role.permissions.permission',
      ],
    });
    return user || { userId: payload.sub, username: payload.username };
  }
}
