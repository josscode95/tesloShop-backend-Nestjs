
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { User } from "../entities/user.entity";

export class JwtStrategy extends PassportStrategy(Strategy) {

    async validate(payload:any):Promise<User> {
        return;
    }

}