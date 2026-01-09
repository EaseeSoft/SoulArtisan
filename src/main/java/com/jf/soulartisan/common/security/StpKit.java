package com.jf.soulartisan.common.security;

import cn.dev33.satoken.jwt.StpLogicJwtForSimple;
import cn.dev33.satoken.stp.StpLogic;

public class StpKit {

    public static final StpLogic ADMIN = new StpLogicJwtForSimple("admin");

    public static final StpLogic USER = new StpLogicJwtForSimple("user");
}
