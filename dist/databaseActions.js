"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickUpdate = exports.db = void 0;
const knex_1 = __importDefault(require("knex"));
const tsKnex_1 = __importDefault(require("./tsKnex"));
exports.db = (0, knex_1.default)(tsKnex_1.default);
const quickUpdate = (query_field, query_value, field, value) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.db)("user").where({
        [query_field]: query_value
    }).update({
        [field]: value
    }).catch(error => {
        console.log("Error in quickUpdate: " + error);
    });
});
exports.quickUpdate = quickUpdate;
