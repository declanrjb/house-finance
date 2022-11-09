# house-finance

This chart represents campaign donations of $1000 or more to representatives in the US House.

The source data was crawled from opensecrets.org, an independent nonprofit whose mission is to "track the flow of money in American politics and provide the data and analysis to strengthen democracy."

Representatives are responsible for reporting this data, and those who chose not to are not represented here. In addition, the most recent publicly available report was used in each case, so some data may be out of date.

Click any node to focus its local network, and click again to dismiss. Double click on any node to open its opensecrets.org page.

This web application was developed by Declan Bradley using react and sigmajs, and incorporates sample code from both libraries. Thank you to the developers of us-house and other GitHub repositories at Civil Service USA for providing data that makes this analysis possible.

The final project is available at https://declanrjb.github.io/house-finance/.

## Methodology

The source data for this chart was crawled from opensecrets.org using R. The script focused on senators as initial data points and charted the donors listed in the "Top Contributors" table of each representative's Open Secrets page, returning only donations over $1000 and only the top 100 donors by amount for each senator. Each senator's Open Secrets id, used in the url query, was taken from an open GitHub repository of senate data available at https://github.com/CivilServiceUSA/us-senate/blob/master/us-senate/data/us-senate.csv. My thanks to the creators of that project for making this work possible.

After cleaning for duplicates and near duplicates (ie, variant spellings and capitalizations), this yielded a total of 3750 nodes and 7049 edges. Five senators have not made recent reports public, and/or did not have Open Secrets ids listed in the above database, and are therefore not included. The remaining nodes and edges were imported into Gephi and arranged using the Fruchterman Reingold method with the following settings:

| Property  | Value   |
|-----------|---------|
| Area      | 37500.0 |
| Gravity   | 2.0     |
| Speed     | 5.0     |

At the time of layout, Gephi factored existing connections and node size into final positions, but had no access to party association or other political information. Any appearance of a party arrangement in the final graph is purely a result of the efficiency calculations built into the Fruchterman Reingold process. The following variables were used at the time of layout:

| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Node size   | Tenth root of amount total in $, given or received |
| Connections | Calculated from the above data set                 |

The following aesthetic attributes were added after the layout process:

| Property     | Value                                                                             |
|--------------|-----------------------------------------------------------------------------------|
| Color        | By party alignment: blue for Democrat, red for Republican, yellow for Independent |
| Edge Weight  | Log base 2 of the amount the edge represents, in $                                |
| Edge Opacity | As a proportion of edge weight, with the same calculation as above                |
| Rotation     | By a random seed, the layout algorithm placed Republicans on the left of the graph and Democrats on the right. The graph was rotated 180 degrees to make this less confusing. |

The finished chart was loaded into the project as a gexf file and rendered using sigmajs.
