/**
 * @fileoverview Canvas Document Validation
 * @author @darianrosebrook
 *
 * Validates canvas documents against JSON Schema using Ajv.
 */function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import Ajv from "ajv";
import addFormats from "ajv-formats";

/**
 * Ajv instance configured for canvas schema validation
 */
const ajv = new Ajv(stryMutAct_9fa48("502") ? {} : (stryCov_9fa48("502"), {
  allErrors: stryMutAct_9fa48("503") ? false : (stryCov_9fa48("503"), true),
  verbose: stryMutAct_9fa48("504") ? false : (stryCov_9fa48("504"), true),
  strict: stryMutAct_9fa48("505") ? true : (stryCov_9fa48("505"), false)
}));
addFormats(ajv);

/**
 * Canvas document schema
 */
const schema = stryMutAct_9fa48("506") ? {} : (stryCov_9fa48("506"), {
  $id: stryMutAct_9fa48("507") ? "" : (stryCov_9fa48("507"), "https://paths.design.dev/schemas/canvas-0.1.json"),
  title: stryMutAct_9fa48("508") ? "" : (stryCov_9fa48("508"), "CanvasDocument"),
  type: stryMutAct_9fa48("509") ? "" : (stryCov_9fa48("509"), "object"),
  required: stryMutAct_9fa48("510") ? [] : (stryCov_9fa48("510"), [stryMutAct_9fa48("511") ? "" : (stryCov_9fa48("511"), "schemaVersion"), stryMutAct_9fa48("512") ? "" : (stryCov_9fa48("512"), "id"), stryMutAct_9fa48("513") ? "" : (stryCov_9fa48("513"), "name"), stryMutAct_9fa48("514") ? "" : (stryCov_9fa48("514"), "artboards")]),
  properties: stryMutAct_9fa48("515") ? {} : (stryCov_9fa48("515"), {
    schemaVersion: stryMutAct_9fa48("516") ? {} : (stryCov_9fa48("516"), {
      const: stryMutAct_9fa48("517") ? "" : (stryCov_9fa48("517"), "0.1.0")
    }),
    id: stryMutAct_9fa48("518") ? {} : (stryCov_9fa48("518"), {
      type: stryMutAct_9fa48("519") ? "" : (stryCov_9fa48("519"), "string"),
      pattern: stryMutAct_9fa48("520") ? "" : (stryCov_9fa48("520"), "^[0-9A-HJKMNP-TV-Z]{26}$")
    }),
    name: stryMutAct_9fa48("521") ? {} : (stryCov_9fa48("521"), {
      type: stryMutAct_9fa48("522") ? "" : (stryCov_9fa48("522"), "string")
    }),
    meta: stryMutAct_9fa48("523") ? {} : (stryCov_9fa48("523"), {
      type: stryMutAct_9fa48("524") ? "" : (stryCov_9fa48("524"), "object"),
      additionalProperties: stryMutAct_9fa48("525") ? false : (stryCov_9fa48("525"), true)
    }),
    artboards: stryMutAct_9fa48("526") ? {} : (stryCov_9fa48("526"), {
      type: stryMutAct_9fa48("527") ? "" : (stryCov_9fa48("527"), "array"),
      items: stryMutAct_9fa48("528") ? {} : (stryCov_9fa48("528"), {
        $ref: stryMutAct_9fa48("529") ? "" : (stryCov_9fa48("529"), "#/$defs/Artboard")
      }),
      minItems: 1
    })
  }),
  $defs: stryMutAct_9fa48("530") ? {} : (stryCov_9fa48("530"), {
    Artboard: stryMutAct_9fa48("531") ? {} : (stryCov_9fa48("531"), {
      type: stryMutAct_9fa48("532") ? "" : (stryCov_9fa48("532"), "object"),
      required: stryMutAct_9fa48("533") ? [] : (stryCov_9fa48("533"), [stryMutAct_9fa48("534") ? "" : (stryCov_9fa48("534"), "id"), stryMutAct_9fa48("535") ? "" : (stryCov_9fa48("535"), "name"), stryMutAct_9fa48("536") ? "" : (stryCov_9fa48("536"), "frame"), stryMutAct_9fa48("537") ? "" : (stryCov_9fa48("537"), "children")]),
      properties: stryMutAct_9fa48("538") ? {} : (stryCov_9fa48("538"), {
        id: stryMutAct_9fa48("539") ? {} : (stryCov_9fa48("539"), {
          type: stryMutAct_9fa48("540") ? "" : (stryCov_9fa48("540"), "string")
        }),
        name: stryMutAct_9fa48("541") ? {} : (stryCov_9fa48("541"), {
          type: stryMutAct_9fa48("542") ? "" : (stryCov_9fa48("542"), "string")
        }),
        frame: stryMutAct_9fa48("543") ? {} : (stryCov_9fa48("543"), {
          $ref: stryMutAct_9fa48("544") ? "" : (stryCov_9fa48("544"), "#/$defs/Rect")
        }),
        background: stryMutAct_9fa48("545") ? {} : (stryCov_9fa48("545"), {
          $ref: stryMutAct_9fa48("546") ? "" : (stryCov_9fa48("546"), "#/$defs/Fill"),
          default: stryMutAct_9fa48("547") ? {} : (stryCov_9fa48("547"), {
            type: stryMutAct_9fa48("548") ? "" : (stryCov_9fa48("548"), "solid"),
            color: stryMutAct_9fa48("549") ? "" : (stryCov_9fa48("549"), "tokens.color.background")
          })
        }),
        children: stryMutAct_9fa48("550") ? {} : (stryCov_9fa48("550"), {
          type: stryMutAct_9fa48("551") ? "" : (stryCov_9fa48("551"), "array"),
          items: stryMutAct_9fa48("552") ? {} : (stryCov_9fa48("552"), {
            $ref: stryMutAct_9fa48("553") ? "" : (stryCov_9fa48("553"), "#/$defs/Node")
          })
        })
      })
    }),
    Node: stryMutAct_9fa48("554") ? {} : (stryCov_9fa48("554"), {
      oneOf: stryMutAct_9fa48("555") ? [] : (stryCov_9fa48("555"), [stryMutAct_9fa48("556") ? {} : (stryCov_9fa48("556"), {
        $ref: stryMutAct_9fa48("557") ? "" : (stryCov_9fa48("557"), "#/$defs/FrameNode")
      }), stryMutAct_9fa48("558") ? {} : (stryCov_9fa48("558"), {
        $ref: stryMutAct_9fa48("559") ? "" : (stryCov_9fa48("559"), "#/$defs/TextNode")
      }), stryMutAct_9fa48("560") ? {} : (stryCov_9fa48("560"), {
        $ref: stryMutAct_9fa48("561") ? "" : (stryCov_9fa48("561"), "#/$defs/ComponentInstanceNode")
      })])
    }),
    BaseNode: stryMutAct_9fa48("562") ? {} : (stryCov_9fa48("562"), {
      type: stryMutAct_9fa48("563") ? "" : (stryCov_9fa48("563"), "object"),
      required: stryMutAct_9fa48("564") ? [] : (stryCov_9fa48("564"), [stryMutAct_9fa48("565") ? "" : (stryCov_9fa48("565"), "id"), stryMutAct_9fa48("566") ? "" : (stryCov_9fa48("566"), "type"), stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), "name"), stryMutAct_9fa48("568") ? "" : (stryCov_9fa48("568"), "visible"), stryMutAct_9fa48("569") ? "" : (stryCov_9fa48("569"), "frame"), stryMutAct_9fa48("570") ? "" : (stryCov_9fa48("570"), "style")]),
      properties: stryMutAct_9fa48("571") ? {} : (stryCov_9fa48("571"), {
        id: stryMutAct_9fa48("572") ? {} : (stryCov_9fa48("572"), {
          type: stryMutAct_9fa48("573") ? "" : (stryCov_9fa48("573"), "string")
        }),
        type: stryMutAct_9fa48("574") ? {} : (stryCov_9fa48("574"), {
          type: stryMutAct_9fa48("575") ? "" : (stryCov_9fa48("575"), "string")
        }),
        name: stryMutAct_9fa48("576") ? {} : (stryCov_9fa48("576"), {
          type: stryMutAct_9fa48("577") ? "" : (stryCov_9fa48("577"), "string")
        }),
        visible: stryMutAct_9fa48("578") ? {} : (stryCov_9fa48("578"), {
          type: stryMutAct_9fa48("579") ? "" : (stryCov_9fa48("579"), "boolean"),
          default: stryMutAct_9fa48("580") ? false : (stryCov_9fa48("580"), true)
        }),
        frame: stryMutAct_9fa48("581") ? {} : (stryCov_9fa48("581"), {
          $ref: stryMutAct_9fa48("582") ? "" : (stryCov_9fa48("582"), "#/$defs/Rect")
        }),
        style: stryMutAct_9fa48("583") ? {} : (stryCov_9fa48("583"), {
          $ref: stryMutAct_9fa48("584") ? "" : (stryCov_9fa48("584"), "#/$defs/Style")
        }),
        data: stryMutAct_9fa48("585") ? {} : (stryCov_9fa48("585"), {
          type: stryMutAct_9fa48("586") ? "" : (stryCov_9fa48("586"), "object"),
          additionalProperties: stryMutAct_9fa48("587") ? false : (stryCov_9fa48("587"), true)
        }),
        bind: stryMutAct_9fa48("588") ? {} : (stryCov_9fa48("588"), {
          $ref: stryMutAct_9fa48("589") ? "" : (stryCov_9fa48("589"), "#/$defs/Binding")
        })
      })
    }),
    FrameNode: stryMutAct_9fa48("590") ? {} : (stryCov_9fa48("590"), {
      allOf: stryMutAct_9fa48("591") ? [] : (stryCov_9fa48("591"), [stryMutAct_9fa48("592") ? {} : (stryCov_9fa48("592"), {
        $ref: stryMutAct_9fa48("593") ? "" : (stryCov_9fa48("593"), "#/$defs/BaseNode")
      }), stryMutAct_9fa48("594") ? {} : (stryCov_9fa48("594"), {
        properties: stryMutAct_9fa48("595") ? {} : (stryCov_9fa48("595"), {
          type: stryMutAct_9fa48("596") ? {} : (stryCov_9fa48("596"), {
            const: stryMutAct_9fa48("597") ? "" : (stryCov_9fa48("597"), "frame")
          }),
          layout: stryMutAct_9fa48("598") ? {} : (stryCov_9fa48("598"), {
            $ref: stryMutAct_9fa48("599") ? "" : (stryCov_9fa48("599"), "#/$defs/Layout")
          }),
          children: stryMutAct_9fa48("600") ? {} : (stryCov_9fa48("600"), {
            type: stryMutAct_9fa48("601") ? "" : (stryCov_9fa48("601"), "array"),
            items: stryMutAct_9fa48("602") ? {} : (stryCov_9fa48("602"), {
              $ref: stryMutAct_9fa48("603") ? "" : (stryCov_9fa48("603"), "#/$defs/Node")
            })
          })
        })
      })])
    }),
    TextNode: stryMutAct_9fa48("604") ? {} : (stryCov_9fa48("604"), {
      allOf: stryMutAct_9fa48("605") ? [] : (stryCov_9fa48("605"), [stryMutAct_9fa48("606") ? {} : (stryCov_9fa48("606"), {
        $ref: stryMutAct_9fa48("607") ? "" : (stryCov_9fa48("607"), "#/$defs/BaseNode")
      }), stryMutAct_9fa48("608") ? {} : (stryCov_9fa48("608"), {
        properties: stryMutAct_9fa48("609") ? {} : (stryCov_9fa48("609"), {
          type: stryMutAct_9fa48("610") ? {} : (stryCov_9fa48("610"), {
            const: stryMutAct_9fa48("611") ? "" : (stryCov_9fa48("611"), "text")
          }),
          text: stryMutAct_9fa48("612") ? {} : (stryCov_9fa48("612"), {
            type: stryMutAct_9fa48("613") ? "" : (stryCov_9fa48("613"), "string")
          }),
          textStyle: stryMutAct_9fa48("614") ? {} : (stryCov_9fa48("614"), {
            $ref: stryMutAct_9fa48("615") ? "" : (stryCov_9fa48("615"), "#/$defs/TextStyle")
          })
        }),
        required: stryMutAct_9fa48("616") ? [] : (stryCov_9fa48("616"), [stryMutAct_9fa48("617") ? "" : (stryCov_9fa48("617"), "text")])
      })])
    }),
    ComponentInstanceNode: stryMutAct_9fa48("618") ? {} : (stryCov_9fa48("618"), {
      allOf: stryMutAct_9fa48("619") ? [] : (stryCov_9fa48("619"), [stryMutAct_9fa48("620") ? {} : (stryCov_9fa48("620"), {
        $ref: stryMutAct_9fa48("621") ? "" : (stryCov_9fa48("621"), "#/$defs/BaseNode")
      }), stryMutAct_9fa48("622") ? {} : (stryCov_9fa48("622"), {
        properties: stryMutAct_9fa48("623") ? {} : (stryCov_9fa48("623"), {
          type: stryMutAct_9fa48("624") ? {} : (stryCov_9fa48("624"), {
            const: stryMutAct_9fa48("625") ? "" : (stryCov_9fa48("625"), "component")
          }),
          componentKey: stryMutAct_9fa48("626") ? {} : (stryCov_9fa48("626"), {
            type: stryMutAct_9fa48("627") ? "" : (stryCov_9fa48("627"), "string")
          }),
          props: stryMutAct_9fa48("628") ? {} : (stryCov_9fa48("628"), {
            type: stryMutAct_9fa48("629") ? "" : (stryCov_9fa48("629"), "object"),
            additionalProperties: stryMutAct_9fa48("630") ? false : (stryCov_9fa48("630"), true)
          })
        }),
        required: stryMutAct_9fa48("631") ? [] : (stryCov_9fa48("631"), [stryMutAct_9fa48("632") ? "" : (stryCov_9fa48("632"), "componentKey")])
      })])
    }),
    Rect: stryMutAct_9fa48("633") ? {} : (stryCov_9fa48("633"), {
      type: stryMutAct_9fa48("634") ? "" : (stryCov_9fa48("634"), "object"),
      required: stryMutAct_9fa48("635") ? [] : (stryCov_9fa48("635"), [stryMutAct_9fa48("636") ? "" : (stryCov_9fa48("636"), "x"), stryMutAct_9fa48("637") ? "" : (stryCov_9fa48("637"), "y"), stryMutAct_9fa48("638") ? "" : (stryCov_9fa48("638"), "width"), stryMutAct_9fa48("639") ? "" : (stryCov_9fa48("639"), "height")]),
      properties: stryMutAct_9fa48("640") ? {} : (stryCov_9fa48("640"), {
        x: stryMutAct_9fa48("641") ? {} : (stryCov_9fa48("641"), {
          type: stryMutAct_9fa48("642") ? "" : (stryCov_9fa48("642"), "number")
        }),
        y: stryMutAct_9fa48("643") ? {} : (stryCov_9fa48("643"), {
          type: stryMutAct_9fa48("644") ? "" : (stryCov_9fa48("644"), "number")
        }),
        width: stryMutAct_9fa48("645") ? {} : (stryCov_9fa48("645"), {
          type: stryMutAct_9fa48("646") ? "" : (stryCov_9fa48("646"), "number"),
          minimum: 0
        }),
        height: stryMutAct_9fa48("647") ? {} : (stryCov_9fa48("647"), {
          type: stryMutAct_9fa48("648") ? "" : (stryCov_9fa48("648"), "number"),
          minimum: 0
        })
      })
    }),
    Style: stryMutAct_9fa48("649") ? {} : (stryCov_9fa48("649"), {
      type: stryMutAct_9fa48("650") ? "" : (stryCov_9fa48("650"), "object"),
      properties: stryMutAct_9fa48("651") ? {} : (stryCov_9fa48("651"), {
        fills: stryMutAct_9fa48("652") ? {} : (stryCov_9fa48("652"), {
          type: stryMutAct_9fa48("653") ? "" : (stryCov_9fa48("653"), "array"),
          items: stryMutAct_9fa48("654") ? {} : (stryCov_9fa48("654"), {
            $ref: stryMutAct_9fa48("655") ? "" : (stryCov_9fa48("655"), "#/$defs/Fill")
          })
        }),
        strokes: stryMutAct_9fa48("656") ? {} : (stryCov_9fa48("656"), {
          type: stryMutAct_9fa48("657") ? "" : (stryCov_9fa48("657"), "array"),
          items: stryMutAct_9fa48("658") ? {} : (stryCov_9fa48("658"), {
            $ref: stryMutAct_9fa48("659") ? "" : (stryCov_9fa48("659"), "#/$defs/Stroke")
          })
        }),
        radius: stryMutAct_9fa48("660") ? {} : (stryCov_9fa48("660"), {
          type: stryMutAct_9fa48("661") ? "" : (stryCov_9fa48("661"), "number")
        }),
        opacity: stryMutAct_9fa48("662") ? {} : (stryCov_9fa48("662"), {
          type: stryMutAct_9fa48("663") ? "" : (stryCov_9fa48("663"), "number"),
          minimum: 0,
          maximum: 1
        }),
        shadow: stryMutAct_9fa48("664") ? {} : (stryCov_9fa48("664"), {
          $ref: stryMutAct_9fa48("665") ? "" : (stryCov_9fa48("665"), "#/$defs/Shadow")
        })
      }),
      additionalProperties: stryMutAct_9fa48("666") ? true : (stryCov_9fa48("666"), false)
    }),
    Fill: stryMutAct_9fa48("667") ? {} : (stryCov_9fa48("667"), {
      type: stryMutAct_9fa48("668") ? "" : (stryCov_9fa48("668"), "object"),
      properties: stryMutAct_9fa48("669") ? {} : (stryCov_9fa48("669"), {
        type: stryMutAct_9fa48("670") ? {} : (stryCov_9fa48("670"), {
          enum: stryMutAct_9fa48("671") ? [] : (stryCov_9fa48("671"), [stryMutAct_9fa48("672") ? "" : (stryCov_9fa48("672"), "solid"), stryMutAct_9fa48("673") ? "" : (stryCov_9fa48("673"), "linearGradient"), stryMutAct_9fa48("674") ? "" : (stryCov_9fa48("674"), "radialGradient")])
        }),
        color: stryMutAct_9fa48("675") ? {} : (stryCov_9fa48("675"), {
          type: stryMutAct_9fa48("676") ? "" : (stryCov_9fa48("676"), "string")
        }),
        stops: stryMutAct_9fa48("677") ? {} : (stryCov_9fa48("677"), {
          type: stryMutAct_9fa48("678") ? "" : (stryCov_9fa48("678"), "array"),
          items: stryMutAct_9fa48("679") ? {} : (stryCov_9fa48("679"), {
            $ref: stryMutAct_9fa48("680") ? "" : (stryCov_9fa48("680"), "#/$defs/ColorStop")
          })
        })
      }),
      required: stryMutAct_9fa48("681") ? [] : (stryCov_9fa48("681"), [stryMutAct_9fa48("682") ? "" : (stryCov_9fa48("682"), "type")]),
      additionalProperties: stryMutAct_9fa48("683") ? true : (stryCov_9fa48("683"), false)
    }),
    Stroke: stryMutAct_9fa48("684") ? {} : (stryCov_9fa48("684"), {
      type: stryMutAct_9fa48("685") ? "" : (stryCov_9fa48("685"), "object"),
      properties: stryMutAct_9fa48("686") ? {} : (stryCov_9fa48("686"), {
        color: stryMutAct_9fa48("687") ? {} : (stryCov_9fa48("687"), {
          type: stryMutAct_9fa48("688") ? "" : (stryCov_9fa48("688"), "string")
        }),
        thickness: stryMutAct_9fa48("689") ? {} : (stryCov_9fa48("689"), {
          type: stryMutAct_9fa48("690") ? "" : (stryCov_9fa48("690"), "number"),
          minimum: 0
        })
      }),
      required: stryMutAct_9fa48("691") ? [] : (stryCov_9fa48("691"), [stryMutAct_9fa48("692") ? "" : (stryCov_9fa48("692"), "color"), stryMutAct_9fa48("693") ? "" : (stryCov_9fa48("693"), "thickness")]),
      additionalProperties: stryMutAct_9fa48("694") ? true : (stryCov_9fa48("694"), false)
    }),
    Shadow: stryMutAct_9fa48("695") ? {} : (stryCov_9fa48("695"), {
      type: stryMutAct_9fa48("696") ? "" : (stryCov_9fa48("696"), "object"),
      properties: stryMutAct_9fa48("697") ? {} : (stryCov_9fa48("697"), {
        x: stryMutAct_9fa48("698") ? {} : (stryCov_9fa48("698"), {
          type: stryMutAct_9fa48("699") ? "" : (stryCov_9fa48("699"), "number")
        }),
        y: stryMutAct_9fa48("700") ? {} : (stryCov_9fa48("700"), {
          type: stryMutAct_9fa48("701") ? "" : (stryCov_9fa48("701"), "number")
        }),
        blur: stryMutAct_9fa48("702") ? {} : (stryCov_9fa48("702"), {
          type: stryMutAct_9fa48("703") ? "" : (stryCov_9fa48("703"), "number")
        }),
        spread: stryMutAct_9fa48("704") ? {} : (stryCov_9fa48("704"), {
          type: stryMutAct_9fa48("705") ? "" : (stryCov_9fa48("705"), "number")
        }),
        color: stryMutAct_9fa48("706") ? {} : (stryCov_9fa48("706"), {
          type: stryMutAct_9fa48("707") ? "" : (stryCov_9fa48("707"), "string")
        })
      }),
      additionalProperties: stryMutAct_9fa48("708") ? true : (stryCov_9fa48("708"), false)
    }),
    ColorStop: stryMutAct_9fa48("709") ? {} : (stryCov_9fa48("709"), {
      type: stryMutAct_9fa48("710") ? "" : (stryCov_9fa48("710"), "object"),
      properties: stryMutAct_9fa48("711") ? {} : (stryCov_9fa48("711"), {
        offset: stryMutAct_9fa48("712") ? {} : (stryCov_9fa48("712"), {
          type: stryMutAct_9fa48("713") ? "" : (stryCov_9fa48("713"), "number"),
          minimum: 0,
          maximum: 1
        }),
        color: stryMutAct_9fa48("714") ? {} : (stryCov_9fa48("714"), {
          type: stryMutAct_9fa48("715") ? "" : (stryCov_9fa48("715"), "string")
        })
      }),
      required: stryMutAct_9fa48("716") ? [] : (stryCov_9fa48("716"), [stryMutAct_9fa48("717") ? "" : (stryCov_9fa48("717"), "offset"), stryMutAct_9fa48("718") ? "" : (stryCov_9fa48("718"), "color")])
    }),
    TextStyle: stryMutAct_9fa48("719") ? {} : (stryCov_9fa48("719"), {
      type: stryMutAct_9fa48("720") ? "" : (stryCov_9fa48("720"), "object"),
      properties: stryMutAct_9fa48("721") ? {} : (stryCov_9fa48("721"), {
        family: stryMutAct_9fa48("722") ? {} : (stryCov_9fa48("722"), {
          type: stryMutAct_9fa48("723") ? "" : (stryCov_9fa48("723"), "string")
        }),
        size: stryMutAct_9fa48("724") ? {} : (stryCov_9fa48("724"), {
          type: stryMutAct_9fa48("725") ? "" : (stryCov_9fa48("725"), "number")
        }),
        lineHeight: stryMutAct_9fa48("726") ? {} : (stryCov_9fa48("726"), {
          type: stryMutAct_9fa48("727") ? "" : (stryCov_9fa48("727"), "number")
        }),
        weight: stryMutAct_9fa48("728") ? {} : (stryCov_9fa48("728"), {
          type: stryMutAct_9fa48("729") ? "" : (stryCov_9fa48("729"), "string")
        }),
        letterSpacing: stryMutAct_9fa48("730") ? {} : (stryCov_9fa48("730"), {
          type: stryMutAct_9fa48("731") ? "" : (stryCov_9fa48("731"), "number")
        }),
        color: stryMutAct_9fa48("732") ? {} : (stryCov_9fa48("732"), {
          type: stryMutAct_9fa48("733") ? "" : (stryCov_9fa48("733"), "string")
        })
      }),
      additionalProperties: stryMutAct_9fa48("734") ? true : (stryCov_9fa48("734"), false)
    }),
    Layout: stryMutAct_9fa48("735") ? {} : (stryCov_9fa48("735"), {
      type: stryMutAct_9fa48("736") ? "" : (stryCov_9fa48("736"), "object"),
      properties: stryMutAct_9fa48("737") ? {} : (stryCov_9fa48("737"), {
        mode: stryMutAct_9fa48("738") ? {} : (stryCov_9fa48("738"), {
          enum: stryMutAct_9fa48("739") ? [] : (stryCov_9fa48("739"), [stryMutAct_9fa48("740") ? "" : (stryCov_9fa48("740"), "absolute"), stryMutAct_9fa48("741") ? "" : (stryCov_9fa48("741"), "flex"), stryMutAct_9fa48("742") ? "" : (stryCov_9fa48("742"), "grid")]),
          default: stryMutAct_9fa48("743") ? "" : (stryCov_9fa48("743"), "absolute")
        }),
        direction: stryMutAct_9fa48("744") ? {} : (stryCov_9fa48("744"), {
          enum: stryMutAct_9fa48("745") ? [] : (stryCov_9fa48("745"), [stryMutAct_9fa48("746") ? "" : (stryCov_9fa48("746"), "row"), stryMutAct_9fa48("747") ? "" : (stryCov_9fa48("747"), "column")])
        }),
        gap: stryMutAct_9fa48("748") ? {} : (stryCov_9fa48("748"), {
          type: stryMutAct_9fa48("749") ? "" : (stryCov_9fa48("749"), "number")
        }),
        padding: stryMutAct_9fa48("750") ? {} : (stryCov_9fa48("750"), {
          type: stryMutAct_9fa48("751") ? "" : (stryCov_9fa48("751"), "number")
        })
      }),
      additionalProperties: stryMutAct_9fa48("752") ? true : (stryCov_9fa48("752"), false)
    }),
    Binding: stryMutAct_9fa48("753") ? {} : (stryCov_9fa48("753"), {
      type: stryMutAct_9fa48("754") ? "" : (stryCov_9fa48("754"), "object"),
      properties: stryMutAct_9fa48("755") ? {} : (stryCov_9fa48("755"), {
        token: stryMutAct_9fa48("756") ? {} : (stryCov_9fa48("756"), {
          type: stryMutAct_9fa48("757") ? "" : (stryCov_9fa48("757"), "string")
        }),
        prop: stryMutAct_9fa48("758") ? {} : (stryCov_9fa48("758"), {
          type: stryMutAct_9fa48("759") ? "" : (stryCov_9fa48("759"), "string")
        }),
        cssVar: stryMutAct_9fa48("760") ? {} : (stryCov_9fa48("760"), {
          type: stryMutAct_9fa48("761") ? "" : (stryCov_9fa48("761"), "string")
        })
      }),
      additionalProperties: stryMutAct_9fa48("762") ? true : (stryCov_9fa48("762"), false)
    })
  })
});
const validate = ajv.compile(schema);

/**
 * Validate a canvas document against the schema
 * @param doc Document to validate
 * @returns Validation result
 */
export function validateCanvasDocument(doc: unknown): {
  valid: boolean;
  errors?: Array<{
    message: string;
    path?: string;
  }>;
  data?: any;
} {
  if (stryMutAct_9fa48("763")) {
    {}
  } else {
    stryCov_9fa48("763");
    const valid = validate(doc);
    if (stryMutAct_9fa48("765") ? false : stryMutAct_9fa48("764") ? true : (stryCov_9fa48("764", "765"), valid)) {
      if (stryMutAct_9fa48("766")) {
        {}
      } else {
        stryCov_9fa48("766");
        return stryMutAct_9fa48("767") ? {} : (stryCov_9fa48("767"), {
          valid: stryMutAct_9fa48("768") ? false : (stryCov_9fa48("768"), true),
          data: doc
        });
      }
    }
    return stryMutAct_9fa48("769") ? {} : (stryCov_9fa48("769"), {
      valid: stryMutAct_9fa48("770") ? true : (stryCov_9fa48("770"), false),
      errors: stryMutAct_9fa48("773") ? validate.errors?.map(error => ({
        message: error.message || "Validation error",
        path: error.instancePath || undefined
      })) && [] : stryMutAct_9fa48("772") ? false : stryMutAct_9fa48("771") ? true : (stryCov_9fa48("771", "772", "773"), (stryMutAct_9fa48("774") ? validate.errors.map(error => ({
        message: error.message || "Validation error",
        path: error.instancePath || undefined
      })) : (stryCov_9fa48("774"), validate.errors?.map(stryMutAct_9fa48("775") ? () => undefined : (stryCov_9fa48("775"), error => stryMutAct_9fa48("776") ? {} : (stryCov_9fa48("776"), {
        message: stryMutAct_9fa48("779") ? error.message && "Validation error" : stryMutAct_9fa48("778") ? false : stryMutAct_9fa48("777") ? true : (stryCov_9fa48("777", "778", "779"), error.message || (stryMutAct_9fa48("780") ? "" : (stryCov_9fa48("780"), "Validation error"))),
        path: stryMutAct_9fa48("783") ? error.instancePath && undefined : stryMutAct_9fa48("782") ? false : stryMutAct_9fa48("781") ? true : (stryCov_9fa48("781", "782", "783"), error.instancePath || undefined)
      }))))) || (stryMutAct_9fa48("784") ? ["Stryker was here"] : (stryCov_9fa48("784"), [])))
    });
  }
}

/**
 * Validate with detailed error reporting
 * @param doc Document to validate
 * @returns Detailed validation result
 */
export function validateWithDetails(doc: unknown): {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  data?: any;
} {
  if (stryMutAct_9fa48("785")) {
    {}
  } else {
    stryCov_9fa48("785");
    const result = validateCanvasDocument(doc);
    if (stryMutAct_9fa48("787") ? false : stryMutAct_9fa48("786") ? true : (stryCov_9fa48("786", "787"), result.valid)) {
      if (stryMutAct_9fa48("788")) {
        {}
      } else {
        stryCov_9fa48("788");
        return stryMutAct_9fa48("789") ? {} : (stryCov_9fa48("789"), {
          valid: stryMutAct_9fa48("790") ? false : (stryCov_9fa48("790"), true),
          data: result.data
        });
      }
    }
    return stryMutAct_9fa48("791") ? {} : (stryCov_9fa48("791"), {
      valid: stryMutAct_9fa48("792") ? true : (stryCov_9fa48("792"), false),
      errors: stryMutAct_9fa48("795") ? result.errors?.map(err => `${err.path ? `${err.path}: ` : ""}${err.message}`) && [] : stryMutAct_9fa48("794") ? false : stryMutAct_9fa48("793") ? true : (stryCov_9fa48("793", "794", "795"), (stryMutAct_9fa48("796") ? result.errors.map(err => `${err.path ? `${err.path}: ` : ""}${err.message}`) : (stryCov_9fa48("796"), result.errors?.map(stryMutAct_9fa48("797") ? () => undefined : (stryCov_9fa48("797"), err => stryMutAct_9fa48("798") ? `` : (stryCov_9fa48("798"), `${err.path ? stryMutAct_9fa48("799") ? `` : (stryCov_9fa48("799"), `${err.path}: `) : stryMutAct_9fa48("800") ? "Stryker was here!" : (stryCov_9fa48("800"), "")}${err.message}`))))) || (stryMutAct_9fa48("801") ? ["Stryker was here"] : (stryCov_9fa48("801"), [])))
    });
  }
}