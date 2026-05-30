jQuery(function() {
    jQuery('#lttab>li').click(function(e) {
        var num = jQuery(this).index();
        jQuery('#lttab>li').removeClass('on');
        jQuery(this).addClass('on');
        jQuery('#lttab_contents>li').hide();
        jQuery('#lttab_contents>li').eq(num).show();


		var idx = jQuery(this).attr('code');

			if(idx == 'A'){
				jQuery('.fntrvt > li').show();
			}else{
				jQuery('.fntrvt > li').stop().hide();
				jQuery('.fntrvt > li[code='+idx+']').stop().show();
			}

		jQuery('.fntnum').html(jQuery('.fntrvt > li:visible').length)
    });
});





jQuery(document).on( "click", "fntrvt li" , function(e) {	

	//facility_load();
})


var params = {};


function facility_load(){
		//params.facilityCode = jQuery('li.facility_type.on').attr('code');
		//exec_json('its.procFacilityList', params, facility_list_reload);
}


function facility_list_reload(_result){

			/*
			if(_result.data.length > 0){
				jQuery('.lectureBody').html('');
				for(var i in _result.data){

					var item = _result.data[i];
					var _html = '';

					_html += '<tr code="'+item.lesson_detail_code+'">';
					_html += '<td class="tleft"><a href="">'+item.lecture_name+' ▶ '+item.wk_name+' ▶ '+item.level_name+'반 </a></td>';
					_html += '<td>'+item.lecture_day_s+'~'+item.lecture_day_e+'</td>';
					_html += '<td>'+item.lesson_time_s+'~'+item.lesson_time_e+'</td>';
					_html += '<td>'+item.btn_html+'</td>';
					_html += '<td>'+item.applic_count+'/'+item.lesson_class_people+'</td>';
					_html += '<td>'+((item.instructor_name)?item.instructor_name:'-')+'</td>';
					_html += '</tr>';

					jQuery('.lectureBody').append(_html);
						
				}
			}else{
				jQuery('.lectureBody').html('<li>예약가능한 시설이 없습니다.</li>');
			}
		*/

}