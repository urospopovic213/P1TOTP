import { Knex } from "knex"



const config: Knex.Config = {
    client: "mysql",
    connection: {
        host: "localhost",
        user: "root",
        password: "uros",
        database: "p1totp"
    }
}


export default config