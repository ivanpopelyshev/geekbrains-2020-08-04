import md5 from "md5";
import uuid from "uuid";

const api_secret = 'VmGsge58F2kL6TOCoHnq';

export class User {
    token: string;
    viewer_id: number;
    nickname: string;
    is_bot : number | false;
    constructor(options: any) {
        const {token, viewer_id} = options || {};
        this.token = token || uuid();
        this.viewer_id = +viewer_id || 0;
        this.nickname = null;
        this.is_bot = options.is_bot || false;
    }
}

export const userByViewer = {}, userByToken = {};

export function getUser(req: any) {
    const {viewer_id, api_id, auth_key} = req.query;
    const check_auth_key = md5(api_id + '_' + viewer_id + '_' + api_secret);

    if (auth_key !== check_auth_key) {
        return false;
    }

    let usr = userByViewer[viewer_id];
    if (usr) {
        return usr;
    }
    usr = new User({viewer_id});
    userByViewer[usr.viewer_id] = userByToken[usr.token] = usr;

    return usr;
}
