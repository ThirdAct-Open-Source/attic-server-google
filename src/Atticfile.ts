import {
    IApplicationContext,
    IPlugin
} from '@znetstar/attic-common/lib/Server';
import { promises as fs } from 'fs';
import {
    IIdentityEntity as
        IIdentityEntityBase
} from "@znetstar/attic-common/lib/IIdentity";

import {
    IAccessToken
} from "@znetstar/attic-common/lib/IAccessToken";

import { GenericError } from '@znetstar/attic-common/lib/Error/GenericError'
import fetch from "node-fetch";
import {IError} from "@znetstar/attic-common/lib/Error/IError";
import {IIdentity} from "@znetstar/attic-common";
import * as _ from 'lodash';

interface IIdentityEntityModel{
    externalId: string;
    otherFields?: any;
}

type IIdentityEntity = IIdentityEntityModel&IIdentityEntityBase&IIdentity;

export class AtticServerGoogle implements IPlugin {
    constructor(public applicationContext: IApplicationContext) {

    }

    public async googleGoogleIdentity(accessToken: IAccessToken): Promise<IIdentityEntity> {
        let resp = await fetch(`https://www.googleapis.com/userinfo/v2/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`
            }
        });

        let body:  any;
        let e2: any;
        try { body = await resp.json(); }
        catch (err) { e2 = err; }

        if (resp.status !== 200) {
            throw new GenericError(`Could not locate Google identity`, 2001, 403, (
                body || e2
            ) as any as IError);
        }


        let fields: IIdentityEntity = {
            firstName: body.given_name,
            lastName: body.family_name,
            clientName: accessToken.clientName,
            phone: '',
            email: `${body.id}.google@${_.get(this, 'applicationContext.config.emailHostname') || process.env.EMAIL_HOSTNAME}`,
            otherFields: body,
            source: {
                href: `https://www.googleapis.com/userinfo/v2/${body.id}`
            },
            type: 'IdentityEntity',
            client: accessToken.client,
            user: null,
            externalId: body.id,
            id: null,
            _id: null
        };

        return fields;
    }


    public async init(): Promise<void> {
        this.applicationContext.registerHook<IIdentityEntity>(`Client.getIdentityEntity.google.provider`, this.googleGoogleIdentity);
    }

    public get name(): string {
        return JSON.parse((require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf8'))).name;
    }
}

export default AtticServerGoogle;