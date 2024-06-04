import knex from "knex"
import config from "./tsKnex"
import { error } from "console"


export const db = knex(config)



export const quickUpdate = async (query_field: string, query_value: any, 
                            field: string, value: any) => {

    await db("user").where({
        [query_field]: query_value 
    }).update({
        [field]: value
    }).catch(error => {
        console.log("Error in quickUpdate: " + error)
    })
}