# TimeReports Rickard Holmberg
| Date        |  Hours  | Activity                                       |
| ----------- | ------- |------------------------------------------------
| 2019-11-11  | 1       | Fixing amazon credit and setting up vm. |
| 2019-11-11  | 1.5     | Getting node server up and public with example html file. |
| 2019-11-18  | 0.5	    | Installed and initialized a MYSQL server |
| 2019-11-19  | 1	    | Connected db with node and fixed issues | 
| 2019-11-20  | 3	    | Corrected tables in db and started on simulator. |
| 2019-11-21  | 7       | Major update for sim including temp, wind, ele, network ele, still having issues with retriving data from db. |
| 2019-11-25  | 8       | Fixed several issues getting data from db, works now. 
Fixed so it does everything in correct order. Just need to fix the values generated and used, not correct currently.
| 2019-11-25  | 1       | Fixed value generated for electricity generation. Not addded to simulation yet. |
| 2019-11-26  | 1       | Started looking at restful-api. |
| 2019-11-27  | 5       | Started work on api. Added fix to sim, started on api, stopped spoof tests from generating more households then needed. |
| 2019-12-1   | 4       | HTTPS and hashing research. |
| 2019-12-5   | 0.5     | Presentation for meeting. |
| 2019-12-5   | 4.5     | Hashing passwords, login, signup, added new database for server. |
| 2019-12-6   | 0.5     | Research for tokens. |
| 2019-12-8   | 1       | Token implementation, loop with sleep for simulator. |
| 2019-12-9   | 4       | Token with cookies, captcha work, user add image of house. |
| 2019-12-10  | 3       | Some work trying to make pictures work for captchas and to store images in db. |
| 2019-12-12  | 4       | User can upload image of house, is displayed. Some work on connecting API. Captcha works as intended. |
| 2019-12-12  | 2.5     | Finally connected to API, need to rework how it works later. Original plan won't work. |
| 2019-12-16  | 1       | Moved functions to new API standard, not yet updated the whole way. |
| 2019-12-17  | 3       | Admin startpage, active sessions, logging ips and cookie removal on logout. |
| 2020-1-3    | 2       | Early work on buffer, added debug to remove tokens. Started on report. |
| 2020-1-4    | 2       | Added ability to change settings in simulator using API, added function for settings in server. |
| 2020-1-4    | 2       | Added page to change settings, not implemented fully yet. |
| 2020-1-8    | 2       | More implementation of settings in simulator, buffer added to simulator. |
| 2020-1-10   | 5       | Work on getting JSON data on a page from database & API. |
| 2020-1-12   | 2       | Added powerplant including functions in simulator to update and buy power. |
| 2020-1-14   | 3       | More work on powerplant, including ability to block users from buying. |
| 2020-1-15   | 8       | Fixed issues with API, trying to fix user page, currently able to send data and format it. |
| 2020-1-16   | 6       | Began work on the report, also trying to send data from the API and formatting. |
| 2020-1-17   | 8       | More on report, fixed issues and features in the simulator and API and server. |
| 2020-1-21   | 3       | Config for API, simulator and server. |
| 2020-1-23   | 4       | Report and work on simulator. |
| 2020-1-27   | 3       | Work on self-certificate (For demo), blackout implement and more robustness for simulator. |
| 2020-1-28   | 2       | Added ability to change powercost in simulator. This is a per plant basis. More robustness also. |
| 2020-1-29   | 2       | Now blocking should work, API also removes block (sim does too), since sim only check when buying power. |