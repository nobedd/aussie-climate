function init(){
    var color = d3.scaleQuantize() 
                    .domain([0,1200])                
                    .range(['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']);

    var projection = d3.geoMercator()
                    .center([133, -28])
                    .translate([480, 300])
                    .scale(900);

    var path = d3.geoPath()
                .projection(projection);

    var svg;
    
    // create svg function
    function createSvgMap(){
        svg = d3.select("#chart")
        .append("svg")
        .attr('viewBox', '0 0 960 600')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr("width", "100%")
        .attr("fill", "lightgrey");
    }
    function removeSVG(){
        d3.selectAll("svg").remove();
    }

    var tooltip = d3.select("div.tooltip");

    //states name
    var AU_States_Acronyms_Array = ["WA", "NT", "SA", "QLD", "NSW", "VIC", "TAS", "ACT"]
    var AU_States_Full_Name_Array = ["Western Australia", "Northern Territory", "South Australia", "Queensland", "New South Wales", "Victoria", "Tasmania", "Australian Capital Territory"]

    var start_year;
    var end_year;
    var year_period;
    var dataTime;
    // set dataTime function 
    function setDataTimeDuration(){
        dataTime = d3.range(0, year_period+2).map(function(d) {
            return new Date(start_year + d, 1, 1);
        });
    }

    // Circles data Array initialize
    var sites = new Array();
                    
    // State total value Initiailize
    var states = new Array();

    // Australia yearly mean readings
    var australia_mean_readings = new Array();
        
    //chosen csv data
    var csv_data;

    //rain or temp / true or false
    var rain_or_temp_bool = true;

    d3.csv("data/PRCPHQ.csv").then(function(rainfall_data){
    d3.csv("data/tmeanahq.csv").then(function(temperature_data){
        d3.json("data/STE_2016_AUST.json").then(function(json){
            
            //  Default options = rainfall
            csv_data = rainfall_data
            createSvgMap();
            rain_or_temp_bool = true;
             
            start_year = 1863;
            end_year = 2018;
            year_period = end_year - start_year;

            resetStatesAndSitesWithYear(start_year, csv_data)
            setDataTimeDuration();

            drawMap(json, rain_or_temp_bool);

            //draw line chart
            getAllStatesMean(csv_data);
            drawLineChart(rain_or_temp_bool);
            
            //button temperature
            d3.select("#btn_temp").on("click", function(){
                console.log("temp clicked")
                rain_or_temp_bool = false;
                d3.selectAll("#title").html("Australia Temperature 1910-2012")
                removeSVG();
                createSvgMap();

                color = d3.scaleQuantize() 
                        .domain([8,30])                
                        .range(['#313695','#4575b4','#74add1','#abd9e9','#e0f3f8','#ffffbf','#fee090','#fdae61','#f46d43','#d73027','#a50026']);
                    
                start_year = 1910
                end_year = 2011;
                year_period = end_year - start_year;
                setDataTimeDuration();

                csv_data = temperature_data;
                resetStatesAndSitesWithYear(start_year, csv_data);

                drawMap(json, rain_or_temp_bool);

                australia_mean_readings = new Array();
                getAllStatesMean(csv_data);
                drawLineChart(rain_or_temp_bool);
                // console.log(totalMeanForEveryStateInAYearArray)
                // console.log(dataArray)
            })

            //button rainfall
            d3.select("#btn_rain").on("click", function(){
                console.log("rain clicked")
                rain_or_temp_bool = true;
                d3.select("#title").html("Australia Rainfall 1863-2018")
                removeSVG();
                createSvgMap();

                color = d3.scaleQuantize() 
                        .domain([0,1200])                
                        .range(['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']);
                    
                start_year = 1863;
                end_year = 2018;
                year_period = end_year - start_year;
                setDataTimeDuration();

                csv_data = rainfall_data;
                resetStatesAndSitesWithYear(start_year, csv_data);  

                drawMap(json, rain_or_temp_bool);
                australia_mean_readings = new Array();

                getAllStatesMean(csv_data);
                drawLineChart(rain_or_temp_bool);
                // console.log(totalMeanForEveryStateInAYearArray)
                // console.log(dataArray)
            })

        
        }).catch(function(error){
            alert(error);
        })
    }).catch(function(error){
        alert(error);
    })
    }).catch(function(error){
        alert(error);
    })

    //Reset All Rain Data With Year Function
    function resetStatesAndSitesWithYear(year, data){
        //Reset Arrays
        sites = new Array();
        states = new Array();

        //populate states
        AU_States_Full_Name_Array.forEach(state => {
            var stateObject = new Object();
            stateObject.state = state;
            stateObject.value = 0;
            stateObject.count = 0;
            stateObject.mean = 0;

            states.push(stateObject);
        }) 
        
        for(j = 0; j < data.length; j++){
            var siteStartYear = parseInt(String(data[j].StartYear).slice(0,4))
            if(year >= siteStartYear){
                var dataPosition = year - siteStartYear;
                
                // console.log(year,siteStartYear,data[j][dataPosition] != "",data[j][dataPosition])
                if(data[j][dataPosition] != ""){
                    var siteValue = parseFloat(data[j][dataPosition]);
                    //if missing value, continue loop
                    if(siteValue == 99999.9){
                        continue;
                    }
                    var siteName = data[j].Name;
                    var siteLat = data[j].Lat;
                    var siteLon = data[j].Long;

                    var siteState = "";
                    //convert state acronyms to full names
                    for(k=0; k<AU_States_Acronyms_Array.length; k++){
                        if(data[j].State == AU_States_Acronyms_Array[k]){
                            siteState = AU_States_Full_Name_Array[k];
                            break;
                        }     
                    }

                    //Gather info for circles
                    var dataObject = new Object();
                    dataObject.siteValue = siteValue;
                    dataObject.siteName = siteName;
                    dataObject.siteState = siteState;
                    dataObject.siteLat =  siteLat;
                    dataObject.siteLong = siteLon;
                    
                    sites.push(dataObject);


                    // Gather all rainfall value for each state
                    states.forEach(state => {
                        if(state.state == siteState){
                            state.value += siteValue;
                            state.count += 1;
                        }
                    })
                }
            }  
        }
        states.forEach(state => {
            state.mean = state.value / state.count;
        })
             
    }
    
    function drawMap(json, rainortemp){
        console.log("drawmap")

        //get State mean function
        function getStateMeanWithStateName(stateName){
            var mean = 0;
            for(i=0;i<states.length;i++){
                state = states[i];
                if(stateName == state.state){
                    mean = state.mean;
                    if(isNaN(mean))
                        mean = 0;
                    // console.log(mean);
                    break;
                }
            }
            return mean;
        }
        
        //draw map
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("class", function(d){
                str = d.properties.STE_NAME16;
                return str.replace(/\s+/g, '');
            })
            .attr("fill", function(d){
                var mean = getStateMeanWithStateName(d.properties.STE_NAME16);
                console.log(mean);
                if(mean == 0)
                    return "lightgrey";
                else
                    return color(mean);
            })
            .on("mouseover", function(d, i){
                // console.log(this.className)
                return tooltip.style("display", "inline")
                            .html(function(){
                                var mean = getStateMeanWithStateName(d.properties.STE_NAME16).toFixed(1)

                                if(rainortemp)
                                    return d.properties.STE_NAME16 + ", " + mean + "mm/year";
                                else
                                    return d.properties.STE_NAME16 + ", " + mean + "°C";
                            })   
            })
            .on("mousemove", function(d){
                tooltip.style("display", "inline")
                        .style("top", (d3.event.pageY) + "px")
                        .style("left", (d3.event.pageX) + "px")
                        
            })
            .on("mouseout",function(){
                tooltip.style("display", "none");
            });

        //draw circles/points
        svg.selectAll("circle")
            .data(sites)
            .enter().append("circle")
            .attr("cx", function(d){
                return projection([d.siteLong, d.siteLat])[0];
            })
            .attr("cy", function(d){
                return projection([d.siteLong, d.siteLat])[1];
            })
            .attr("r", 5)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("fill", function(d){
                return color(d.siteValue)
            })
            .on("mouseover", function(d){
                tooltip.style("display", "inline")
                    .style("top", (d3.event.pageY) + "px")
                    .style("left", (d3.event.pageX) + "px")
                    .html(function(){
                        if(rainortemp)
                            return d.siteName +", "+ (d.siteValue).toFixed(1) + "mm/year"
                        else{
                            return d.siteName +", "+ (d.siteValue).toFixed(1) + "°C"
                        }
                    })
            });

        //draw legend
        svg.append("g")
            .attr("class", "legendQuant")
            .attr("transform", "translate(830,140)");

        var legend = d3.legendColor()
            .labelFormat(d3.format(".0f"))
            .title(function(){
                if(rainortemp)
                    return "Rain mm/year"
                else
                    return "Temperature °C"
            })
            .titleWidth(110)
            .scale(color);

        svg.select(".legendQuant")
            .call(legend);
        
        //draw slider function
        var boolExecuted = true;
        var sliderTime = d3.sliderBottom()
                        .min(d3.min(dataTime))
                        .max(d3.max(dataTime))
                        .step(1000 * 60 * 60 * 24 * 365)
                        .width(1800)
                        .tickFormat(d3.timeFormat('%Y'))
                        .default(new Date(start_year, 1, 1))
                        .on('onchange', val => {
                            d3.select('p#value-time').text(d3.timeFormat('%Y')(val));
                            // console.log("sliderChanged")
                            boolExecuted = !boolExecuted

                            if(!boolExecuted){
                                // console.log("slider data executed")
                                resetStatesAndSitesWithYear(d3.timeFormat('%Y')(val),csv_data);
                                
                                AU_States_Full_Name_Array.forEach(function(state){
                                    stateNoSpace = state.replace(/\s+/g, '')
                                    svg.select("."+stateNoSpace)
                                        .attr("fill",function(){
                                            var mean = getStateMeanWithStateName(state)
                                            if(mean == 0)
                                                return "lightgrey";
                                            else
                                                return color(mean);
                                        })
                                })

                                svg.selectAll("circle").remove();

                                svg.selectAll("circle")
                                    .data(sites)
                                    .enter()
                                    .append("circle")
                                    .attr("cx", function(d){
                                        return projection([d.siteLong, d.siteLat])[0];
                                    })
                                    .attr("cy", function(d){
                                        return projection([d.siteLong, d.siteLat])[1];
                                    })
                                    .attr("r", 5)
                                    .attr("stroke", "black")
                                    .attr("stroke-width", "1")
                                    .attr("fill", function(d){
                                        return color(d.siteValue)
                                    })
                                    .on("mouseover", function(d){
                                        tooltip.style("display", "inline")
                                            .style("top", (d3.event.pageY) + "px")
                                            .style("left", (d3.event.pageX) + "px")
                                            .html(function(){
                                                if(rainortemp)
                                                    return d.siteName +", "+ (d.siteValue).toFixed(1) + "mm/year"
                                                else{
                                                    return d.siteName +", "+ (d.siteValue).toFixed(1) + "°C"
                                                }
                                            })
                                    });                                   
                            }
                        });
        
        var gTime = d3.select('div#slider-time')
                    .append('svg')
                    .attr("width", "100%")
                    .append('g')
                    .attr('transform', 'translate(30,30)');
        
        gTime.call(sliderTime);
    }

    function getAllStatesMean(csvdata){
        for(i=start_year;i<end_year+1;i++){
            var statesData = new Object();
            var year = i;
            var WA_value = 0, NT_value = 0, SA_value = 0, QLD_value = 0, NSW_value = 0, VIC_value = 0, TAS_value = 0;
            var WA_count = 0, NT_count = 0, SA_count = 0, QLD_count = 0, NSW_count = 0, VIC_count = 0, TAS_count = 0;

            for(j=0;j<csvdata.length;j++){
                var data = csvdata[j];
                var siteStartYear = parseInt(String(data.StartYear).slice(0,4))
                if(year >= siteStartYear){
                    var dataPosition = year - siteStartYear;

                    if(data[dataPosition] != "" && data[dataPosition] != 99999.9){
                        if(data.State == "WA"){
                            WA_value += parseFloat(data[dataPosition]);
                            WA_count++
                        }
                        else if(data.State == "NT"){
                            NT_value += parseFloat(data[dataPosition]);
                            NT_count++
                        }
                        else if(data.State == "SA"){
                            SA_value += parseFloat(data[dataPosition]);
                            SA_count++
                        }
                        else if(data.State == "QLD"){
                            QLD_value += parseFloat(data[dataPosition]);
                            QLD_count++
                        }
                        else if(data.State == "NSW"){
                            NSW_value += parseFloat(data[dataPosition]);
                            NSW_count++
                        } 
                        else if(data.State == "VIC"){
                            VIC_value += parseFloat(data[dataPosition]);
                            VIC_count++
                        } 
                        else if(data.State == "TAS"){
                            TAS_value += parseFloat(data[dataPosition]);
                            TAS_count++
                        }
                    }
                }
            }

            statesData.year = i;
            statesData.WA_value = WA_value / WA_count;
            statesData.NT_value = NT_value / NT_count;
            statesData.SA_value = SA_value / SA_count;
            statesData.QLD_value = QLD_value / QLD_count;
            statesData.NSW_value = NSW_value / NSW_count;
            statesData.VIC_value = VIC_value / VIC_count;
            statesData.TAS_value = TAS_value / TAS_count;
            statesData.Total = (statesData.WA_value+statesData.NT_value+statesData.SA_value+statesData.QLD_value+statesData.NSW_value+statesData.VIC_value+statesData.TAS_value)/7
            australia_mean_readings.push(statesData);
            
        }
    }

    
    function drawLineChart(rainortemp){
        


        var height = 400;
        var parseTime = d3.timeParse("%Y");

        var yScaleMinDomain = 0
        var yScaleMaxDomain = 1000
        if(!rainortemp){
            yScaleMinDomain = 15;
            yScaleMaxDomain = 20;
        }
           
        var xScale = d3.scaleTime()
            .domain([parseTime(start_year), parseTime(end_year)   ]) // input
            .range([0, 900]); // output
        
        var yScale = d3.scaleLinear()
            .domain([yScaleMinDomain, yScaleMaxDomain]) // input 
            .range([height, 0]); // output 

    
        var svg = d3.select("#linechart")
                    .append("svg")
                    .attr('viewBox', '0 0 960 500')
                    .attr('preserveAspectRatio', 'xMinYMin meet')
                    .attr("width", "100%")
                    .append("g")
                    .attr("transform", "translate(50, 50)");
    
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y"))); 
    
        
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale));

        var line_total = d3.line()
            .defined(d => !isNaN(d.Total))
            .x(function(d) { return xScale(parseTime(d.year)); })
            .y(function(d) { return yScale(d.Total); })
            .curve(d3.curveMonotoneX)

        
        //draw line chart 
        svg.append("path")
            .datum(australia_mean_readings)
            .attr("class", "line") 
            .attr("d", line_total)    
            .attr("stroke", "orange");
    
        //draw line chart data point
        svg.selectAll(".dot")
            .data(australia_mean_readings.filter(function(d){
                return !isNaN(d.Total);
            }))
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", function(d) { 
                return xScale(parseTime(d.year)) 
            })
            .attr("cy", function(d) { 
                return yScale(d.Total) 
            })
            .attr("r", 3)
            .on("mouseover", function(d) { 
                tooltip.style("display", "inline")
                    .style("top", (d3.event.pageY) + "px")
                    .style("left", (d3.event.pageX) + "px")
                    .html(function(){
                        if(rainortemp){
                            return d.year + " Average: " + (d.Total).toFixed(1) + "mm/year";
                        }else
                            return d.year + " Average: " + (d.Total).toFixed(1) + "°C";
                    })
            })
            .on("mouseout", function(){
                tooltip.style("display", "none")
            })
    }
    


}

window.onload = init;