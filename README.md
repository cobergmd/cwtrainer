# CW Training and Listening Web Application
CW (Morse Code) Trainer

Just an excuse to mess around with the Web Audio API

2. Copy the following into a file called vehicles.properties and adjust the file path for vehicles.json as necessary:

```properties
jdbc.driver=cdata.jdbc.rest.RESTDriver
jdbc.url=jdbc:rest:
ext.URI=/change/this/path/vehicles.json
ext.DataModel=Relational
ext.Format=JSON
```
3. Run the following command to create a Virtual Graph for the JSON document:

```bash
stardog-admin virtual add vehicles.properties
```
4. Run the following command to query the Virtual Graph:

```bash
stardog query <db> "select * from <virtual://vehicles> where { ?vehicle a <http://api.stardog.com/vehicles> . ?vehicle <http://api.stardog.com/vehicles#features> ?features . }"
```
5. You should have gotten the following results:

```console
+---------------------------------------+----------------------------------+
|                vehicle                |             features             |
+---------------------------------------+----------------------------------+
| http://api.stardog.com/vehicles/_id=1 | "[\"sunroof\",\"rims\"]"         |
| http://api.stardog.com/vehicles/_id=2 | "[\"lift kit\",\"tow package\"]" |
+---------------------------------------+----------------------------------+
```

