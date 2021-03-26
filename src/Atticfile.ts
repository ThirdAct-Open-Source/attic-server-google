import {
    ApplicationContextBase
} from '@znetstar/attic-server/lib/ApplicationContext';
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

interface IIdentityEntityModel{
    externalId: string;
    otherFields?: any;
}

type IIdentityEntity = IIdentityEntityModel&IIdentityEntityBase&IIdentity;

export async function googleGoogleIdentity(accessToken: IAccessToken): Promise<IIdentityEntity> {
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
        email: body.email || `${body.id}.google@profile.etomon.com`,
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


export async function init(ctx: ApplicationContextBase) {
    ctx.on(`Client.getIdentityEntity.google.provider`, googleGoogleIdentity);
}